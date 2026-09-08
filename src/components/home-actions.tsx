"use client";

import { useState } from "react";
import { ImagePlus, Plus, Send } from "lucide-react";

type Room = { id: string; name: string; type: string };

export function HomeActions({ rooms }: { rooms: Room[] }) {
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createPost(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, content }) });
    const result = await response.json();
    setMessage(response.ok ? "Posted anonymously." : result.error ?? "Could not publish post.");
    if (response.ok) setContent("");
    setBusy(false);
  }

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: groupName, description: "Student-created anonymous discussion group", type: "general" }) });
    const result = await response.json();
    setMessage(response.ok ? "Group created. Refresh to see it in your rooms." : result.error ?? "Could not create group.");
    if (response.ok) setGroupName("");
    setBusy(false);
  }

  return <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
    <form onSubmit={createPost} className="glass-panel rounded-3xl p-5">
      <div className="font-ui mb-4 flex items-center justify-between"><div><p className="eyebrow">Your anonymous voice</p><h2 className="mt-1 text-2xl">Ask a question or start a post</h2></div><ImagePlus size={20} className="text-[var(--teal)]"/></div>
      <textarea required maxLength={500} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What is on your mind?" className="font-ui min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-4 outline-none focus:border-[var(--teal)]" />
      <div className="font-ui mt-4 flex flex-col gap-3 sm:flex-row"><select value={roomId} onChange={(event) => setRoomId(event.target.value)} className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 outline-none" aria-label="Choose room">{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><button disabled={busy || !roomId} className="auth-submit rounded-xl bg-[var(--teal)] px-5 py-3 font-bold text-[#061615]"><Send size={15} className="mr-2 inline"/> {busy ? "Publishing…" : "Publish anonymously"}</button></div>
    </form>
    <form onSubmit={createGroup} className="glass-panel rounded-3xl p-5"><p className="eyebrow">Build a room</p><h2 className="mt-1 text-2xl">Create a group</h2><p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">Start a focused space for a subject, hostel, event, or department.</p><input required maxLength={80} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="font-ui mt-5 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 outline-none focus:border-[var(--teal)]"/><button disabled={busy} className="auth-submit mt-3 w-full rounded-xl border border-[var(--teal)] px-4 py-3 font-bold text-[var(--teal)]"><Plus size={15} className="mr-2 inline"/> Create group</button></form>
    {message && <p role="status" className="font-ui text-sm text-[var(--teal)] lg:col-span-2">{message}</p>}
  </div>;
}
