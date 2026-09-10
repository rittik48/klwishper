"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function AccountSetup() {
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8 || password !== confirmation) { setMessage("Use at least 8 characters and make both passwords match."); return; }
    setBusy(true);
    const client = createClient();
    const { error: passwordError } = await client.auth.updateUser({ password });
    if (passwordError) { setMessage(passwordError.message); setBusy(false); return; }
    const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ department, year }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "Could not create your profile."); setBusy(false); return; }
    router.push("/home");
  }

  return <form onSubmit={submit} className="font-ui mt-8 space-y-5"><label className="block text-sm font-bold">Department<input required maxLength={80} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Computer Science" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><label className="block text-sm font-bold">Year / batch<input required maxLength={30} value={year} onChange={(event) => setYear(event.target.value)} placeholder="2nd year" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><label className="block text-sm font-bold">Create password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><label className="block text-sm font-bold">Confirm password<input required type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><button disabled={busy} className="auth-submit w-full rounded-xl bg-[var(--teal)] px-4 py-3 font-bold text-[#061615]">{busy ? "Creating account…" : "Confirm account"}</button>{message && <p role="alert" className="text-sm text-[var(--coral)]">{message}</p>}<p className="text-xs leading-5 text-[var(--muted)]">Your password is handled by Supabase Auth and is never saved as readable text by WhisperKL.</p></form>;
}
