"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { siteConfig, isCollegeEmail } from "@/config/site";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const error = new URLSearchParams(window.location.search).get("error");
    return error ? `Sign-in link error: ${error}` : "";
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isCollegeEmail(email)) { setMessage(`Use your ${siteConfig.collegeName} email ending in @${siteConfig.emailDomain}.`); return; }
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setMessage(error ? `Supabase could not send the link: ${error.message}` : "Check your college inbox for the secure sign-in link.");
  }
  return <main className="font-ui flex min-h-screen items-center justify-center px-6 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><ArrowLeft size={16}/> Back to {siteConfig.name}</Link><div className="rounded-3xl border border-[var(--line)] bg-white p-8 shadow-xl shadow-teal-900/5"><div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f2ea] text-[var(--teal)]"><Mail/></div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--teal)]">Student access</p><h1 className="mt-2 font-serif text-4xl">Welcome to {siteConfig.name}</h1><p className="mt-3 leading-6 text-[var(--muted)]">Sign in with your {siteConfig.collegeName} email. Your identity stays private from other students.</p></div><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-bold">College email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={`student-id@${siteConfig.emailDomain}`} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--teal)]"/></label><button className="w-full rounded-xl bg-[var(--teal)] px-4 py-3 font-bold text-white">Send secure sign-in link</button></form>{message && <p role="status" className="mt-5 rounded-xl bg-[#f2f7f3] p-3 text-sm leading-5">{message}</p>}<p className="mt-7 flex gap-2 text-xs leading-5 text-[var(--muted)]"><ShieldCheck size={16} className="shrink-0 text-[var(--teal)]"/> Anonymous to students. The platform retains ownership records for safety and moderation.</p></div></div></main>;
}
