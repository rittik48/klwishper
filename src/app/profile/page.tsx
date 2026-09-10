import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnonymousIdentity } from "@/components/anonymous-identity";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("anonymous_label, department, year").eq("id", user.id).maybeSingle();
  return <main className="font-ui mx-auto max-w-3xl px-6 py-16"><p className="eyebrow">Private profile</p><h1 className="mt-3 font-serif text-5xl">Your anonymous profile</h1><p className="mt-5 text-[var(--muted)]">Only non-sensitive context is shown here. Your email and student ID are never public.</p><div className="glass-panel mt-8 rounded-3xl p-6"><AnonymousIdentity initialLabel={profile?.anonymous_label ?? "Anonymous"}/><dl className="mt-7 grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-2"><div><dt className="text-sm text-[var(--muted)]">Year</dt><dd className="mt-1 font-bold">{profile?.year ?? "Not detected"}</dd></div><div><dt className="text-sm text-[var(--muted)]">Branch</dt><dd className="mt-1 font-bold">{profile?.department ?? "Not detected"}</dd></div></dl></div></main>;
}
