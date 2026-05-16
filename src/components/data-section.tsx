/**
 * Reusable section wrapper — title + optional action + content card.
 * Konzistentní spacing napříč stránkami.
 */
import { Card, CardContent } from "@/components/ui/card";

export function DataSection({
  title,
  description,
  action,
  children,
  noPadding = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground/80 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <Card>
        <CardContent className={noPadding ? "p-0" : "pt-4"}>{children}</CardContent>
      </Card>
    </section>
  );
}
