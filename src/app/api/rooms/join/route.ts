import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const roomId = (await request.json().catch(() => null))?.roomId;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (typeof roomId !== "string") return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  const { error } = await supabase.from("room_members").insert({ room_id: roomId, user_id: user.id, status: "approved" });
  if (error) return NextResponse.json({ error: "Unable to join room" }, { status: 400 });
  return NextResponse.json({ ok: true });
}