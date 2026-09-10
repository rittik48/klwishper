import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountAccess } from "@/components/account-access";

export default function LoginPage() {
  return <main className="font-ui flex min-h-screen items-center justify-center px-6 py-12"><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><ArrowLeft size={16}/> Back to {siteConfig.name}</Link><ThemeToggle/></div><div className="glass-panel rounded-3xl p-8"><div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f2ea] text-[var(--teal)]"><Mail/></div><p className="eyebrow">Student access</p><h1 className="mt-2 font-serif text-4xl">Welcome to {siteConfig.name}</h1><p className="mt-3 leading-6 text-[var(--muted)]">Verify your {siteConfig.collegeName} email once, then use your password for future logins.</p></div><AccountAccess/><p className="mt-7 flex gap-2 text-xs leading-5 text-[var(--muted)]"><ShieldCheck size={16} className="shrink-0 text-[var(--teal)]"/> Anonymous to students. The platform retains ownership records for safety and moderation.</p></div></div></main>;
}
