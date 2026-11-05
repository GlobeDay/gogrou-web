"use client";

import {
  createReturnShipment,
  receiveReturnShipment,
  sendServiceShipment,
  setServiceShipmentStatus,
} from "../ops/actions";
import { OpsSubmit } from "../ops/ops-form";

export function ShipmentControls({
  shipmentId,
  direction,
  status,
  hasReturn,
}: {
  shipmentId: string;
  direction: string;
  status: string;
  hasReturn: boolean;
}) {
  const toService = direction === "to_service";
  return (
    <div className="flex flex-wrap gap-2">
      {toService && status === "draft" && (
        <>
          <OpsSubmit label="Odeslat do brusírny" run={() => sendServiceShipment(shipmentId)} />
          <OpsSubmit label="Zrušit" variant="outline" run={() => setServiceShipmentStatus(shipmentId, "cancelled")} />
        </>
      )}
      {toService && status === "sent_to_service" && (
        <OpsSubmit label="Přijato brusírnou" run={() => setServiceShipmentStatus(shipmentId, "received_by_service")} />
      )}
      {toService && status === "received_by_service" && (
        <>
          <OpsSubmit label="Ve zpracování" variant="outline" run={() => setServiceShipmentStatus(shipmentId, "in_progress")} />
          <OpsSubmit label="Dokončeno" run={() => setServiceShipmentStatus(shipmentId, "done")} />
        </>
      )}
      {toService && status === "in_progress" && (
        <>
          <OpsSubmit label="Částečně hotovo" variant="outline" run={() => setServiceShipmentStatus(shipmentId, "partial")} />
          <OpsSubmit label="Dokončeno" run={() => setServiceShipmentStatus(shipmentId, "done")} />
        </>
      )}
      {toService && status === "partial" && (
        <OpsSubmit label="Dokončeno" run={() => setServiceShipmentStatus(shipmentId, "done")} />
      )}
      {toService && !hasReturn && ["received_by_service", "in_progress", "partial", "done"].includes(status) && (
        <OpsSubmit label="Vytvořit návratovou zásilku" variant="secondary" run={() => createReturnShipment(shipmentId)} />
      )}
      {!toService && status === "ready" && (
        <OpsSubmit label="Odesláno zákazníkovi" variant="outline" run={() => setServiceShipmentStatus(shipmentId, "shipped")} />
      )}
      {!toService && ["ready", "shipped"].includes(status) && (
        <OpsSubmit label="Přijmout návrat na sklad" run={() => receiveReturnShipment(shipmentId)} />
      )}
    </div>
  );
}
