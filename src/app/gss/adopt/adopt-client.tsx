"use client";

import { adoptGpcProduct } from "../ops/actions";
import { OpsSubmit } from "../ops/ops-form";

export function AdoptButton({ productId }: { productId: string }) {
  return (
    <OpsSubmit
      label="Převzít do skladu"
      variant="outline"
      run={() => adoptGpcProduct(productId)}
    />
  );
}
