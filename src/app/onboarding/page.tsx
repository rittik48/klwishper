import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSetup } from "@/components/account-setup";

export default async function OnboardingPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/login");
	return <main className="font-ui mx-auto max-w-xl px-6 py-16"><p className="eyebrow">Verified access</p><h1 className="mt-3 font-serif text-5xl">Create your account.</h1><p className="mt-5 leading-7 text-[var(--muted)]">Your college email is confirmed. Choose your campus context and password. We will assign a random anonymous name after confirmation.</p><div className="glass-panel mt-8 rounded-3xl p-6"><p className="text-sm text-[var(--muted)]">Verified college email</p><p className="mt-2 font-bold">{user.email}</p><AccountSetup/></div></main>;
}
