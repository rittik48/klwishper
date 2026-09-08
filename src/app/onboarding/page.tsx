import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export default async function OnboardingPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/login");
	return <main className="font-ui mx-auto max-w-xl px-6 py-16"><p className="eyebrow">Verified access</p><h1 className="mt-3 font-serif text-5xl">A little context helps.</h1><p className="mt-5 leading-7 text-[var(--muted)]">Your email is verified. The next step is choosing your department and year so {siteConfig.name} can shape relevant conversations without revealing who you are.</p><div className="glass-panel mt-8 rounded-3xl p-6"><p className="text-sm text-[var(--muted)]">Signed in as</p><p className="mt-2 font-bold">{user.email}</p><p className="mt-5 text-sm leading-6 text-[var(--muted)]">Profile setup is ready for the next step. Once saved, you will enter your private campus feed.</p></div><a href="/home" className="mt-8 inline-block rounded-full bg-[var(--teal)] px-5 py-3 font-bold text-[#061615]">Continue to WhisperKL</a></main>;
}
