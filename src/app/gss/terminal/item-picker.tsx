"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "../ops/ops-form";

export type PickerItem = {
  id: string;
  label: string;
  /** další texty, přes které se filtruje (GID, výrobce…) */
  keywords?: string;
};

/**
 * Výběr položky s fulltextovým filtrem místo čistého dropdownu
 * (P2 akceptačního reportu: hledání místo rolování v seznamu).
 */
export function ItemPicker({
  items,
  value,
  onChange,
  label = "Položka",
}: {
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((it) => `${it.label} ${it.keywords ?? ""}`.toLowerCase().includes(f));
  }, [items, filter]);
  const valueVisible = filtered.some((it) => it.id === value);

  return (
    <Field label={label}>
      <div className="grid gap-1.5">
        <Input
          placeholder="Filtrovat podle názvu, GID, výrobce…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            const f = e.target.value.trim().toLowerCase();
            if (f) {
              const match = items.filter((it) => `${it.label} ${it.keywords ?? ""}`.toLowerCase().includes(f));
              if (match.length > 0 && !match.some((it) => it.id === value)) onChange(match[0].id);
            }
          }}
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={valueVisible ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {!valueVisible && <option value="" disabled>— vyber položku —</option>}
          {filtered.map((it) => (
            <option key={it.id} value={it.id}>{it.label}</option>
          ))}
        </select>
        {filter && (
          <p className="text-2xs text-muted-foreground">
            {filtered.length} z {items.length} položek
          </p>
        )}
      </div>
    </Field>
  );
}
