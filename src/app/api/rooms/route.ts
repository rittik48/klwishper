import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roomSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!rateLimit(`room:${user.id}`, 3).allowed) return NextResponse.json({ error: "Group creation limit reached" }, { status: 429 });
  const parsed = roomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid group details" }, { status: 400 });
  const { data, error } = await supabase.from("rooms").insert(parsed.data).select("id, name, description, type").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A group with this name already exists" : "Unable to create group" }, { status: 400 });
  return NextResponse.json({ room: data }, { status: 201 });
}
