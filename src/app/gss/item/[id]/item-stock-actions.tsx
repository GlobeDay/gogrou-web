"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { TrackingMode } from "@/lib/gss-lock";
import { applyStockAction, type StockAction } from "./actions";

type Props = {
  itemId: string;
  canAct: boolean;
  inStockCount: number;
  sharpenableCount: number;
  trackingMode: TrackingMode;
  qtyOnHand: number;
};

const SUCCESS: Record<StockAction, (dm: string | undefined) => string> = {
  receive: (dm) => (dm ? `Příjem +1 · ${dm}` : "Příjem +1"),
  issue: (dm) => (dm ? `Výdej −1 · ${dm} → stroj` : "Výdej −1"),
  sharpen: (dm) => (dm ? `Na broušení · ${dm} → SERVICE_BIN` : "Na broušení"),
};

export function ItemStockActions({
  itemId,
  canAct,
  inStockCount,
  sharpenableCount,
  trackingMode,
  qtyOnHand,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const quantityMode = trackingMode === "quantity";
  const issuable = quantityMode ? qtyOnHand : inStockCount;

  function run(action: StockAction) {
    start(async () => {
      const result = await applyStockAction(itemId, action);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? SUCCESS[result.action](result.dm_code));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Akce (1 kus)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={!canAct || pending}
          onClick={() => run("receive")}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ArrowDownToLine />}
          + Příjem
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canAct || pending || issuable === 0}
          onClick={() => run("issue")}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ArrowUpFromLine />}
          − Výdej
        </Button>
        {!quantityMode && (
          <Button
            type="button"
            variant="secondary"
            disabled={!canAct || pending || sharpenableCount === 0}
            onClick={() => run("sharpen")}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Wrench />}
            Na broušení
          </Button>
        )}
        {!canAct && (
          <span className="text-xs text-muted-foreground">
            Pouze role operator a vyšší.
          </span>
        )}
        {canAct && (
          <span className="text-xs text-muted-foreground">
            {quantityMode
              ? "Množstevní režim · bez DM kódů"
              : "FIFO kus · příjem založí nový DM kód"}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
