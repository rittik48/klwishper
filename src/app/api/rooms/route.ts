import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roomSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
  if (!rateLimit(`room:${user.id}`, 3).allowed) return NextResponse.json({ error: "Group creation limit reached" }, { status: 429 });
  const parsed = roomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid group details" }, { status: 400 });
  const { data, error } = await supabase.from("rooms").insert({ ...parsed.data, owner_id: user.id }).select("id, name, description, type, owner_id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A group with this name already exists" : "Unable to create group" }, { status: 400 });
  return NextResponse.json({ room: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = new URL(request.url).searchParams.get("id");
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!id) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  const { error } = await supabase.from("rooms").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to delete group" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
