/**
 * Sdílený layout pro auth pages — branded header, kartové centrum, zápatí.
 * Použito v login / signup / forgot-password / update-password.
 */
import Link from "next/link";
import { BrandLockup } from "./brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 overflow-hidden">
      {/* Decorative background — subtle radial gradient od primary */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -10%, oklch(from var(--primary) l c h / 0.10), transparent 50%)",
        }}
      />

      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center">
          <Link href="/" aria-label="Gogrou" className="inline-flex items-center">
            <BrandLockup markSize={32} />
          </Link>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </Card>

        {footer && (
          <div className="text-center text-xs text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
