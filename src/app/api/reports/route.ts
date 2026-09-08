import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!rateLimit(`report:${user.id}`, 10).allowed) return NextResponse.json({ error: "Report limit reached" }, { status: 429 });
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  const { data, error } = await supabase.from("reports").insert({ reporter_id: user.id, post_id: parsed.data.postId, reason: parsed.data.reason }).select("id, post_id, reason, status, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to create report" }, { status: 400 });
  return NextResponse.json({ report: data }, { status: 201 });
}
