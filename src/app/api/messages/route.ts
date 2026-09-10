import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!user || !conversationId) return NextResponse.json({ error: "Authentication and conversation are required" }, { status: 401 });
  const { data, error } = await supabase.rpc("conversation_messages", { target_conversation: conversationId });
  if (error) return NextResponse.json({ error: "Unable to load messages" }, { status: 400 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const { data, error } = await supabase.from("messages").insert({ ...parsed.data, sender_id: user.id }).select("id, content, created_at, conversation_id").single();
  if (error) return NextResponse.json({ error: "Unable to send message" }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}