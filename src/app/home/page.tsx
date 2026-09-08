import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export default async function HomePage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/login");
	return <main className="min-h-screen px-5 py-8 sm:px-8"><nav className="font-ui mx-auto flex max-w-6xl items-center justify-between"><Link className="text-xl font-bold" href="/">{siteConfig.name}<span className="text-[var(--coral)]">/</span></Link><span className="flex items-center gap-2 text-sm text-[var(--muted)]"><ShieldCheck size={15} className="text-[var(--teal)]"/> Verified student</span></nav><section className="font-ui mx-auto max-w-6xl py-20"><p className="eyebrow">Private campus feed</p><h1 className="mt-4 max-w-2xl font-serif text-5xl tracking-tight sm:text-7xl">Welcome inside.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">You are signed in. Your student identity is protected from other students while the platform keeps ownership records for safety.</p><div className="glass-panel mt-10 max-w-2xl rounded-3xl p-6"><p className="text-sm text-[var(--muted)]">Signed-in account</p><p className="mt-2 font-bold">{user.email}</p><p className="mt-6 text-sm text-[var(--muted)]">Your feed, rooms, posting, and replies will appear here after onboarding.</p></div><Link href="/preview" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--teal)] px-5 py-3 font-bold text-[#061615]">Explore public preview <LogOut size={16}/></Link></section></main>;
}
