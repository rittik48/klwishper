"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8 || password !== confirmation) {
      setMessage("Use at least 8 characters and make both passwords match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const client = createClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      await client.auth.signOut();
      setMessage("Password updated. Redirecting to login…");
      router.push("/login");
    } catch (error) {
      console.error("Password reset failed", error);
      setMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="font-ui flex min-h-screen items-center justify-center px-6 py-12"><div className="glass-panel w-full max-w-md rounded-3xl p-8"><p className="eyebrow">Account recovery</p><h1 className="mt-2 font-serif text-4xl">Choose a new password.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Use at least 8 characters. Your password is stored securely by Supabase Auth.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold">New password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><label className="block text-sm font-bold">Confirm password<input required type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><button disabled={busy} className="auth-submit w-full rounded-xl bg-[var(--teal)] px-4 py-3 font-bold text-[#061615]">{busy ? "Updating…" : "Update password"}</button></form>{message && <p role="status" className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-sm">{message}</p>}<Link href="/login" className="mt-5 inline-block text-sm font-bold text-[var(--teal)] hover:underline">Back to login</Link></div></main>;
}
