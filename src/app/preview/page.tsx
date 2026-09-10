import { ArrowLeft, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Home from "@/app/page";

type PreviewPost = { id: string; content: string; created_at: string; room_id: string };

export default async function PreviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <Home />;

  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("anonymous_label").eq("id", user.id).maybeSingle(),
    supabase.from("posts").select("id, content, created_at, room_id").eq("user_id", user.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(30),
  ]);

  const anonymousLabel = profile?.anonymous_label ?? "Anonymous";

  return <main className="min-h-screen px-5 py-8 sm:px-8"><nav className="font-ui mx-auto flex max-w-5xl items-center justify-between"><Link href="/home" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><ArrowLeft size={16}/> Back to private feed</Link><span className="flex items-center gap-2 text-xs text-[var(--muted)]"><ShieldCheck size={14} className="text-[var(--teal)]"/> Session preserved</span></nav><section className="mx-auto max-w-5xl py-16"><p className="eyebrow">Public preview</p><h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-7xl">Your campus signal.</h1><p className="font-ui mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">Your posts remain attached to this signed-in session and are shown with your anonymous label. This page does not log you out.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{posts?.length ? posts.map((post: PreviewPost) => <article key={post.id} className="glass-panel rounded-2xl p-5"><div className="font-ui flex items-center justify-between text-xs"><span className="font-bold">{anonymousLabel}</span><span className="text-[var(--muted)]">{new Date(post.created_at).toLocaleString()}</span></div><p className="mt-6 text-xl leading-7">{post.content}</p><div className="font-ui mt-6 flex items-center gap-5 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]"><span>Room post</span><span><MessageCircle size={14} className="mr-1 inline"/>0</span><span><Heart size={14} className="mr-1 inline"/>0</span></div></article>) : <div className="glass-panel rounded-2xl p-6"><h2 className="text-2xl">No posts yet</h2><p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">Create your first anonymous question from the private feed and it will appear here.</p><Link href="/home" className="mt-6 inline-flex rounded-full bg-[var(--teal)] px-5 py-3 font-ui text-sm font-bold text-[#061615]">Create a post</Link></div>}</div></section></main>;
}
