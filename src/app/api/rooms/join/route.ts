import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const roomId = (await request.json().catch(() => null))?.roomId;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (typeof roomId !== "string") return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  const { data: room } = await supabase.from("rooms").select("visibility, allow_join, discoverable").eq("id", roomId).maybeSingle();
  if (!room?.discoverable || (room.visibility === "public" && !room.allow_join)) return NextResponse.json({ error: "This group is not accepting joins" }, { status: 403 });
  const { data: existing } = await supabase.from("room_members").select("room_id, status").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, status: existing.status });
  const { error } = await supabase.from("room_members").insert({ room_id: roomId, user_id: user.id, status: room.visibility === "private" ? "pending" : "approved" });
  if (error) return NextResponse.json({ error: "Unable to join room" }, { status: 400 });
  return NextResponse.json({ ok: true, status: room.visibility === "private" ? "pending" : "approved" });
}