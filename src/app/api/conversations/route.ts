import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const targetLabel = (await request.json().catch(() => null))?.targetLabel;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (typeof targetLabel !== "string" || targetLabel.length < 12) return NextResponse.json({ error: "Anonymous name is required" }, { status: 400 });
  const { data, error } = await supabase.rpc("start_conversation", { target_label: targetLabel });
  if (error) return NextResponse.json({ error: "Unable to start conversation" }, { status: 400 });
  return NextResponse.json({ conversationId: data }, { status: 201 });
}