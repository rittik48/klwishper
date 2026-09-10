import { Heart, MessageCircle } from "lucide-react";

type FeedPost = { id: string; content: string; created_at: string; room_name: string; anonymous_label: string };

export function PublicFeed({ posts }: { posts: FeedPost[] }) {
  return <section className="mt-14"><div className="mb-6"><p className="eyebrow">Global public feed</p><h2 className="mt-2 text-4xl">What campus is saying</h2></div>{posts.length === 0 ? <div className="glass-panel rounded-2xl p-6 font-ui text-sm text-[var(--muted)]">No public posts yet. Start the first conversation.</div> : <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <article key={post.id} className="glass-panel rounded-2xl p-5"><div className="font-ui flex items-center justify-between text-xs"><span className="font-bold">{post.anonymous_label}</span><time className="text-[var(--muted)]">{new Date(post.created_at).toLocaleString()}</time></div><p className="mt-5 text-xl leading-7">{post.content}</p><div className="font-ui mt-5 flex items-center gap-5 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]"><span className="text-[var(--teal)]">#{post.room_name}</span><span><MessageCircle size={14} className="mr-1 inline"/>0</span><span><Heart size={14} className="mr-1 inline"/>0</span></div></article>)}</div>}</section>;
}
