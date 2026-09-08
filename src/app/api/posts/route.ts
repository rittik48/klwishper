import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
  const quota = rateLimit(`post:${user.id}`, 5);
  if (!quota.allowed) return NextResponse.json({ error: "Posting limit reached" }, { status: 429 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  const { data, error } = await supabase.from("posts").insert({ user_id: user.id, room_id: parsed.data.roomId, content: parsed.data.content }).select("id, room_id, content, created_at, is_deleted").single();
  if (error) return NextResponse.json({ error: "Unable to create post" }, { status: 400 });
  return NextResponse.json({ post: data }, { status: 201 });
}
