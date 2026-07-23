import { cn } from "@/lib/utils";

/**
 * Eyebrow — jednotný caption/label pattern (uppercase, tracked, muted).
 * Nahrazuje ~7 ručně kopírovaných spec variant napříč appkou.
 *
 *  size="xs"  → micro eyebrow (text-2xs, tracking-label) — default, dense kontexty
 *  size="sm"  → section title (text-sm, tracking-wide)
 */
const SIZES = {
  xs: "text-2xs tracking-label",
  sm: "text-sm tracking-wide",
} as const;

export function Eyebrow({
  children,
  size = "xs",
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  as?: React.ElementType;
  className?: string;
}) {
  return (
    <Tag className={cn("font-semibold uppercase text-muted-foreground", SIZES[size], className)}>
      {children}
    </Tag>
  );
}
