import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!rateLimit(`reply:${user.id}`, 20).allowed) return NextResponse.json({ error: "Reply limit reached" }, { status: 429 });
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
  const { data, error } = await supabase.from("replies").insert({ user_id: user.id, post_id: parsed.data.postId, content: parsed.data.content }).select("id, post_id, content, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to create reply" }, { status: 400 });
  return NextResponse.json({ reply: data }, { status: 201 });
}
