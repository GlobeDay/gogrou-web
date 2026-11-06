"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestGpcValidation } from "../../ops/actions";

export function RequestValidation({ itemId, pending }: { itemId: string; pending: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, start] = useTransition();

  if (pending) {
    return <span className="text-xs text-muted-foreground">Žádost o zařazení do GPC čeká na vyřízení.</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="max-w-xs"
        placeholder="Poznámka pro validátora (volitelné)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() =>
          start(async () => {
            const result = await requestGpcValidation(itemId, message);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(result.message);
            router.refresh();
          })
        }
      >
        {busy ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
        Požádat o zařazení do GPC
      </Button>
    </div>
  );
}
