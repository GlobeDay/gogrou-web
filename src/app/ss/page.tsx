import type { Metadata } from "next";
import { SsClient } from "./ss-client";

export const metadata: Metadata = {
  title: "SmartSplit — Gogrou",
  description: "Skupinové nákupy a cenové akce (demo)",
};

export default function SmartSplitPage() {
  return <SsClient />;
}
