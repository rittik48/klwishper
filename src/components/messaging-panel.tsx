"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type Message = { id: string; content: string; created_at: string; anonymous_label: string };

export function MessagingPanel() {
  const [target, setTarget] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchUsers(value: string) {
    setTarget(value);
    if (value.trim().length < 2) { setUsers([]); return; }
    setSearching(true);
    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(value)}`);
      const result = await response.json().catch(() => ({}));
      setUsers(response.ok ? (result.users ?? []).map((item: { anonymous_label: string }) => item.anonymous_label) : []);
    } catch (error) { console.error("User search failed", error); setUsers([]); }
    finally { setSearching(false); }
  }

  async function start(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetLabel: target }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Unable to start conversation.");
      setConversationId(result.conversationId); setMessage("Conversation ready.");
    } catch (error) { console.error("Start conversation failed", error); setMessage(error instanceof Error ? error.message : "Unable to start conversation."); }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, content }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Unable to send message.");
      setMessages((current) => [...current, { ...result.message, anonymous_label: "You" }]); setContent("");
    } catch (error) { console.error("Send message failed", error); setMessage(error instanceof Error ? error.message : "Unable to send message."); }
  }

  return <section className="mt-14"><div className="mb-5"><p className="eyebrow">Private messages</p><h2 className="mt-2 flex items-center gap-2 text-3xl"><MessageCircle className="text-[var(--teal)]"/> Talk anonymously</h2></div><form onSubmit={start} className="font-ui relative flex gap-2"><input required value={target} onChange={(event) => searchUsers(event.target.value)} placeholder="Search anonymous name" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--teal)]"/><button className="auth-submit rounded-xl bg-[var(--teal)] px-4 font-bold text-[#061615]">Start</button>{users.length > 0 && <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-xl">{users.map((user) => <button key={user} type="button" onClick={() => { setTarget(user); setUsers([]); }} className="block w-full rounded-lg px-3 py-2 text-left font-ui text-sm hover:bg-[var(--teal)]/10">{user}</button>)}</div>}{searching && <span className="self-center text-xs text-[var(--muted)]">Searching…</span>}</form>{conversationId && <div className="glass-panel mt-4 rounded-2xl p-4"><div className="font-ui mb-4 space-y-2 text-sm">{messages.map((item) => <p key={item.id}><strong>{item.anonymous_label}:</strong> {item.content}</p>)}</div><form onSubmit={send} className="font-ui flex gap-2"><input required maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a private message" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2"/><button className="auth-submit rounded-xl bg-[var(--teal)] px-3 text-[#061615]" aria-label="Send message"><Send size={16}/></button></form></div>}{message && <p className="font-ui mt-3 text-sm text-[var(--muted)]">{message}</p>}</section>;
}