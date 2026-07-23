import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Badge variant={variant} title={status} className={cn("gap-1", className)}>
      {showDot && <span className="size-1.5 rounded-full bg-current shrink-0" aria-hidden />}
      <span className="font-mono leading-none">{label}</span>
    </Badge>
  );
}
