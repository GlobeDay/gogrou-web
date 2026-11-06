-- =============================================================================
-- AT-003: Tenant-boundary test (RLS) — doporučený test z acceptance reportu
-- (3. 10. 2026). Ověřuje, že uživatel vidí a mění JEN data svých tenantů.
--
-- Spouštění: v Supabase SQL editoru (nebo psql jako postgres). Každý blok
-- spusť samostatně. Před spuštěním dosaď reálná UUID:
--   :user_a   = uživatel členem JEN tenanta A (gss_user_tenants)
--   :tenant_a = "jeho" tenant, :tenant_b = cizí tenant
-- Bloky se simulovaným uživatelem používají SET LOCAL, takže platí jen
-- uvnitř transakce — nic se nepersistuje (write-proba se sama odrolluje).
--
-- Naposledy provedeno 6. 11. 2026 (tenanty DEV01/ARGO/METROVA): vše PASS,
-- výsledky viz DATABASE.md §8.5.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Baseline bez RLS (service role): skutečné rozložení řádků per tenant
-- ---------------------------------------------------------------------------
SELECT tenant_id, count(*) FROM gss_items     GROUP BY 1;
SELECT tenant_id, count(*) FROM gss_pieces    GROUP BY 1;
SELECT tenant_id, count(*) FROM gss_movements GROUP BY 1;

-- ---------------------------------------------------------------------------
-- 1) Čtecí hranice: pohled uživatele A (člen jen tenanta A)
--    PASS = counts jen pro tenant A odpovídají baseline, cizí tenant = 0,
--    gpc_products (sdílený katalog) > 0, gss_tenants = jen vlastní.
-- ---------------------------------------------------------------------------
BEGIN;
SELECT set_config('request.jwt.claims',
  '{"sub":"<user_a-uuid>","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT 'gss_items' AS tbl,
       count(*) FILTER (WHERE tenant_id = '<tenant_a-uuid>') AS own,
       count(*) FILTER (WHERE tenant_id = '<tenant_b-uuid>') AS foreign_rows,
       count(*) AS total
FROM gss_items
UNION ALL
SELECT 'gss_pieces',
       count(*) FILTER (WHERE tenant_id = '<tenant_a-uuid>'),
       count(*) FILTER (WHERE tenant_id = '<tenant_b-uuid>'),
       count(*)
FROM gss_pieces
UNION ALL
SELECT 'gss_movements',
       count(*) FILTER (WHERE tenant_id = '<tenant_a-uuid>'),
       count(*) FILTER (WHERE tenant_id = '<tenant_b-uuid>'),
       count(*)
FROM gss_movements
UNION ALL
SELECT 'gss_locations',
       count(*) FILTER (WHERE tenant_id = '<tenant_a-uuid>'),
       count(*) FILTER (WHERE tenant_id = '<tenant_b-uuid>'),
       count(*)
FROM gss_locations
UNION ALL
SELECT 'gss_tenants',
       count(*) FILTER (WHERE id = '<tenant_a-uuid>'),
       count(*) FILTER (WHERE id = '<tenant_b-uuid>'),
       count(*)
FROM gss_tenants
UNION ALL
SELECT 'gpc_products', 0, 0, count(*) FROM gpc_products;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- 2) Zápisová hranice: cross-tenant INSERT jako uživatel A do tenanta B.
--    PASS = blok doběhne a vrátí "AT003 PASS…" (RLS vyhodila 42501).
--    FAIL = chyba "AT003 FAIL: cross-tenant INSERT prošel RLS".
-- ---------------------------------------------------------------------------
BEGIN;
SELECT set_config('request.jwt.claims',
  '{"sub":"<user_a-uuid>","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    INSERT INTO gss_items (tenant_id, local_name, local_type)
    VALUES ('<tenant_b-uuid>', 'AT003-PROBE', 'local');
    RAISE EXCEPTION 'AT003 FAIL: cross-tenant INSERT prošel RLS';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- očekávané: RLS insert blokovala (42501)
  END;
END $$;
SELECT 'AT003 PASS: cross-tenant INSERT blokován RLS (42501)' AS result;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- 3) Zápisová hranice: cross-tenant UPDATE (no-op) jako uživatel A.
--    PASS = updated_foreign_rows = 0 (RLS USING cizí řádky odfiltruje).
-- ---------------------------------------------------------------------------
BEGIN;
SELECT set_config('request.jwt.claims',
  '{"sub":"<user_a-uuid>","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
WITH upd AS (
  UPDATE gss_items SET notes = notes
  WHERE tenant_id = '<tenant_b-uuid>'
  RETURNING id
)
SELECT count(*) AS updated_foreign_rows FROM upd;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- 4) Multi-tenant uživatel: opakuj blok 1 se sub uživatele, který je členem
--    více tenantů — PASS = vidí všechny své tenanty a žádný cizí.
-- ---------------------------------------------------------------------------
