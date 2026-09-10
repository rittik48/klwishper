"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { isCollegeEmail, siteConfig } from "@/config/site";

export function AccountAccess() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isCollegeEmail(email)) { setMessage(`Use your ${siteConfig.collegeName} email ending in @${siteConfig.emailDomain}.`); return; }
    setBusy(true);
    const client = createClient();
    if (mode === "signup") {
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?flow=signup`, shouldCreateUser: true } });
      setMessage(error ? `Could not send verification link: ${error.message}` : "Verification link sent once. Check your college inbox and quarantine folder, release it, then click it once.");
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      setMessage(error ? `Login failed: ${error.message}` : "Login successful. Opening your private campus feed…");
      if (!error) router.push("/home");
    }
    setBusy(false);
  }

  return <>
    <div className="font-ui mb-6 grid grid-cols-2 rounded-xl border border-[var(--line)] p-1"><button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-[var(--teal)] text-[#061615]" : "text-[var(--muted)]"}`}>Log in</button><button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "signup" ? "bg-[var(--teal)] text-[#061615]" : "text-[var(--muted)]"}`}>Sign up</button></div>
    <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-bold">College email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={`student-id@${siteConfig.emailDomain}`} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label>{mode === "login" && <label className="block text-sm font-bold">Password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/></label>}<button type="submit" disabled={busy} className="auth-submit w-full rounded-xl bg-[var(--teal)] px-4 py-3 font-bold text-[#061615]">{busy ? "Working…" : mode === "signup" ? "Send one-time verification link" : "Log in securely"}</button></form>
    {message && <p role="status" className="font-ui mt-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-sm leading-5">{message}</p>}
    <p className="font-ui mt-5 text-xs leading-5 text-[var(--muted)]">Sign up uses one email verification only. After confirmation, create a password and use it for future logins. Supabase stores passwords securely; WhisperKL never stores plaintext passwords.</p>
  </>;
}