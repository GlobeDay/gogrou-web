import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className ?? ""}`}>
      <div className="rounded-full bg-muted p-3 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
