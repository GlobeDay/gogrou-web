import { Circle } from "lucide-react";

type Variant = "success" | "info" | "warning" | "destructive" | "neutral";

const STATUS_VARIANT: Record<string, Variant> = {
  // piece_status
  new:           "neutral",
  in_stock:      "success",
  in_preset:     "neutral",
  in_machine:    "info",
  in_production: "info",
  in_service:    "warning",
  scrapped:      "destructive",
  // entity_status
  active:        "success",
  phasing_out:   "warning",
  discontinued:  "destructive",
  // movement_type
  receive:       "success",
  service_in:    "success",
  transfer:      "info",
  issue:         "info",
  service_out:   "warning",
  scrap:         "destructive",
  adjust:        "neutral",
};

const STATUS_LABEL_CS: Record<string, string> = {
  new:           "Nový",
  in_stock:      "Sklad",
  in_preset:     "Preset",
  in_machine:    "Stroj",
  in_production: "Výroba",
  in_service:    "Servis",
  scrapped:      "Vyřazeno",
  active:        "Aktivní",
  phasing_out:   "Výběhové",
  discontinued:  "Ukončeno",
  receive:       "Příjem",
  service_in:    "Ze servisu",
  transfer:      "Přesun",
  issue:         "Výdej",
  service_out:   "Na servis",
  scrap:         "Vyřazení",
  adjust:        "Korekce",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  success:     "bg-success/12 text-success border-success/30",
  info:        "bg-info/12 text-info border-info/30",
  warning:     "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning",
  destructive: "bg-destructive/12 text-destructive border-destructive/30",
  neutral:     "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  showDot = true,
  showLabel = "cs",
  className,
}: {
  status: string;
  showDot?: boolean;
  showLabel?: "cs" | "raw" | "both";
  className?: string;
}) {
  const variant = STATUS_VARIANT[status] ?? "neutral";
  const cs = STATUS_LABEL_CS[status];
  const label =
    showLabel === "cs"   ? (cs ?? status) :
    showLabel === "raw"  ? status :
    /* both */            (cs ? `${cs}` : status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      title={status}
    >
      {showDot && <Circle className="h-1.5 w-1.5 fill-current shrink-0" />}
      <span className="font-mono leading-none">{label}</span>
    </span>
  );
}
