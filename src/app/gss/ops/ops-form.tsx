"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpsResult } from "./actions";

export function OpsSubmit({
  label,
  disabled,
  variant = "default",
  run,
}: {
  label: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
  run: () => Promise<OpsResult>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const result = await run();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(result.message);
          router.refresh();
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {label}
    </Button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
