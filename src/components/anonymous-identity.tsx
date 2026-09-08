"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function AnonymousIdentity({ initialLabel }: { initialLabel: string }) {
  const [label, setLabel] = useState(initialLabel);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    const response = await fetch("/api/profile", { method: "PATCH" });
    const result = await response.json();
    if (response.ok) setLabel(result.profile.anonymous_label);
    setBusy(false);
  }

  return <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">Your anonymous name</p><p className="mt-2 font-bold">{label}</p></div><button type="button" disabled={busy} onClick={refresh} className="icon-button" aria-label="Refresh anonymous name" title="Refresh anonymous name"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/></button></div>;
}
