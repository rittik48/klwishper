"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Send } from "lucide-react";

type Room = { id: string; name: string; type: string; owner_id?: string | null };

export function HomeActions({ rooms }: { rooms: Room[] }) {
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [groupName, setGroupName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [groupList, setGroupList] = useState(rooms);
  const router = useRouter();

  async function createPost(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) { setMessage("Write something before publishing."); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, content }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Publish failed (${response.status})`);
      setContent("");
      setMessage("Posted anonymously.");
      router.refresh();
    } catch (error) {
      console.error("Publish post failed", error);
      setMessage(error instanceof Error ? error.message : "Could not publish post.");
    } finally { setBusy(false); }
  }

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: groupName, description: "Student-created anonymous discussion group", type: "general", visibility, discoverable: true, allowJoin: visibility === "public" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Group creation failed (${response.status})`);
      setGroupName(""); setMessage("Group created.");
      if (result.room) setGroupList((current) => [...current, result.room]);
      router.refresh();
    } catch (error) {
      console.error("Create group failed", error);
      setMessage(error instanceof Error ? error.message : "Could not create group.");
    } finally { setBusy(false); }
  }

  async function deleteGroup(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/rooms?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Delete failed (${response.status})`);
      setGroupList((current) => current.filter((room) => room.id !== id)); setMessage("Group deleted."); router.refresh();
    } catch (error) {
      console.error("Delete group failed", error);
      setMessage(error instanceof Error ? error.message : "Could not delete group.");
    } finally { setBusy(false); }
  }

  return <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
    <form onSubmit={createPost} className="glass-panel rounded-3xl p-5">
      <div className="font-ui mb-4 flex items-center justify-between"><div><p className="eyebrow">Your anonymous voice</p><h2 className="mt-1 text-2xl">Ask a question or start a post</h2></div><ImagePlus size={20} className="text-[var(--teal)]"/></div>
      <textarea required maxLength={500} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What is on your mind?" className="font-ui min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-transparent p-4 outline-none focus:border-[var(--teal)]" />
      <div className="font-ui mt-4 flex flex-col gap-3 sm:flex-row"><select value={roomId} onChange={(event) => setRoomId(event.target.value)} className="dark-select rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-3 outline-none" aria-label="Choose room">{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><button disabled={busy || !roomId} className="auth-submit rounded-xl bg-[var(--teal)] px-5 py-3 font-bold text-[#061615]"><Send size={15} className="mr-2 inline"/> {busy ? "Publishing…" : "Publish anonymously"}</button></div>
    </form>
    <div className="glass-panel rounded-3xl p-5"><p className="eyebrow">Build a room</p><h2 className="mt-1 text-2xl">Create a group</h2><p className="font-ui mt-3 text-sm leading-6 text-[var(--muted)]">Start a focused space for a subject, hostel, event, or department.</p><form onSubmit={createGroup}><input required maxLength={80} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="font-ui mt-5 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 outline-none focus:border-[var(--teal)]"/><select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className="dark-select font-ui mt-3 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-3"><option value="public">Public group</option><option value="private">Private group</option></select><button disabled={busy} className="auth-submit mt-3 w-full rounded-xl border border-[var(--teal)] px-4 py-3 font-bold text-[var(--teal)]"><Plus size={15} className="mr-2 inline"/> Create group</button></form><div className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">{groupList.filter((room) => room.owner_id).map((room) => <div key={room.id} className="font-ui flex items-center justify-between gap-2 text-sm"><span className="truncate">{room.name}</span><button type="button" disabled={busy} onClick={() => deleteGroup(room.id)} className="text-xs text-[var(--coral)] hover:underline">Delete</button></div>)}</div></div>
    {message && <p role="status" className="font-ui text-sm text-[var(--teal)] lg:col-span-2">{message}</p>}
  </div>;
}
