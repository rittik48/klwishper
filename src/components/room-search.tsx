"use client";

import { Search, UserPlus } from "lucide-react";
import { useState } from "react";

type Room = { id: string; name: string; description: string | null; visibility: string; allow_join: boolean };

export function RoomSearch() {
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState<string[]>([]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/rooms?q=${encodeURIComponent(query)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Search failed");
      setRooms(result.rooms ?? []);
      if (!result.rooms?.length) setMessage("No discoverable groups found.");
    } catch (error) { console.error("Room search failed", error); setRooms([]); setMessage(error instanceof Error ? error.message : "Search failed"); }
    finally { setLoading(false); }
  }

  async function join(roomId: string) {
    try {
      const response = await fetch("/api/rooms/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Unable to join group.");
      setJoined((current) => [...new Set([...current, roomId])]); setMessage(result.status === "pending" ? "Join request sent for owner approval." : "Joined group.");
    } catch (error) { console.error("Join room failed", error); setMessage(error instanceof Error ? error.message : "Unable to join group."); }
  }

  return <section className="mt-14"><div className="mb-5"><p className="eyebrow">Find your room</p><h2 className="mt-2 text-3xl">Search groups and rooms</h2></div><form onSubmit={search} className="font-ui flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or description" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/><button className="auth-submit rounded-xl bg-[var(--teal)] px-4 font-bold text-[#061615]" aria-label="Search rooms">{loading ? "…" : <Search size={17}/>}</button></form>{message && <p className="font-ui mt-4 text-sm text-[var(--muted)]">{message}</p>}<div className="mt-4 grid gap-3 md:grid-cols-2">{rooms.map((room) => <article key={room.id} className="glass-panel rounded-2xl p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">{room.name}</h3><p className="font-ui mt-1 text-sm text-[var(--muted)]">{room.description || "Student discussion room"}</p></div>{room.allow_join && <button type="button" disabled={joined.includes(room.id)} onClick={() => join(room.id)} className="auth-submit inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--teal)] px-3 py-2 font-ui text-xs font-bold text-[var(--teal)]"><UserPlus size={14}/> {joined.includes(room.id) ? "Requested" : room.visibility === "private" ? "Request" : "Join"}</button>}</div></article>)}</div></section>;
}
