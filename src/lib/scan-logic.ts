/**
 * DM scan rozhodovací logika.
 * Port z gogrou-api/src/services/scan.ts — viz prompt sekce 8.1.
 */

export type ScanEvent =
  | "RETURN_FROM_MACHINE"
  | "ISSUE_TO_MACHINE"
  | "RETURN_FROM_SERVICE"
  | "INSPECT";

export interface NextAction {
  code: string;
  title: string;
  severity: "info" | "warning" | "critical";
  target_location?: { code: string; name?: string };
  instructions: string[];
}

export interface AllowedTransition {
  action: string;
  to_location_code: string | null;
}

export interface PieceForScan {
  status: string;
  lifecycle: unknown;
}

export function computeNextAction(piece: PieceForScan, event?: ScanEvent): NextAction {
  const lifecycle   = (piece.lifecycle ?? {}) as Record<string, any>;
  const sharpening  = lifecycle.sharpening   ?? {};
  const instructions = lifecycle.instructions ?? {};

  const cyclesDone = Number(sharpening.cycles_done ?? 0);
  const maxCycles  = Number(sharpening.max_cycles  ?? 0);

  if (maxCycles > 0 && cyclesDone >= maxCycles) {
    return {
      code: "SCRAP_OR_REPLACE",
      title: "Nástroj dosáhl maximálního počtu přebroušení",
      severity: "critical",
      instructions: [
        `Cycles: ${cyclesDone}/${maxCycles}`,
        "Doporučení: vyřadit (SCRAP) nebo nahradit novým kusem.",
        "Neprovádět automaticky — vyžaduje rozhodnutí operátora.",
      ],
    };
  }

  if (event === "RETURN_FROM_MACHINE" && piece.status === "in_machine") {
    const onReturn = String(instructions.on_return_from_machine ?? "RETURN_TO_STOCK");
    if (onReturn === "SEND_TO_SERVICE") {
      return {
        code: "SEND_TO_SERVICE",
        title: "Poslat na servis",
        severity: "warning",
        target_location: { code: instructions.service_location_code ?? "SERVICE_BIN" },
        instructions: [
          "Vlož nástroj do servisního boxu.",
          instructions.label_code ? `Označ štítkem ${instructions.label_code}.` : "Označ štítkem.",
          "Po servisu doplň měření průměru.",
        ],
      };
    }
    return {
      code: "RETURN_TO_STOCK",
      title: "Uložit zpět na sklad",
      severity: "info",
      target_location: { code: "MAIN" },
      instructions: ["Vrátit nástroj do MAIN skladu."],
    };
  }

  if (event === "ISSUE_TO_MACHINE" && piece.status === "in_stock") {
    return {
      code: "ISSUE_TO_MACHINE",
      title: "Vydat na stroj",
      severity: "info",
      target_location: { code: "MACHINE-01" },
      instructions: ["Přesun na pracoviště MACHINE-01."],
    };
  }

  if (event === "RETURN_FROM_SERVICE" && piece.status === "in_service") {
    return {
      code: "RETURN_FROM_SERVICE",
      title: "Vrátit ze servisu na sklad",
      severity: "info",
      target_location: { code: "MAIN" },
      instructions: [
        "Po servisu — zkontroluj rozměr a stav.",
        "Aktualizuj lifecycle.dimensions.current_diameter_mm.",
      ],
    };
  }

  return {
    code: "INSPECT",
    title: "Žádná konkrétní akce",
    severity: "info",
    instructions: [`Aktuální stav: ${piece.status}.`, "Vyber akci ručně dle situace."],
  };
}

export function allowedTransitions(piece: PieceForScan): AllowedTransition[] {
  const base: AllowedTransition[] = [
    { action: "MOVE_TO_MAIN",    to_location_code: "MAIN" },
    { action: "MOVE_TO_MACHINE", to_location_code: "MACHINE-01" },
    { action: "MOVE_TO_SERVICE", to_location_code: "SERVICE_BIN" },
  ];
  if (piece.status !== "scrapped") base.push({ action: "SCRAP", to_location_code: null });
  return base;
}

/** Helper pro odvození new status z movement type + target location. */
export function inferStatusFromMovement(
  movement: string,
  toCode?: string | null,
): "new"|"in_stock"|"in_preset"|"in_machine"|"in_production"|"in_service"|"scrapped" | null {
  if (movement === "scrap")        return "scrapped";
  if (movement === "service_out")  return "in_service";
  if (movement === "service_in")   return "in_stock";
  if (movement === "receive")      return "in_stock";
  if (toCode === "MAIN")           return "in_stock";
  if (toCode === "PRESET")         return "in_preset";
  if (toCode?.startsWith("MACHINE")) return "in_machine";
  if (toCode === "SERVICE_BIN")    return "in_service";
  return null;
}
