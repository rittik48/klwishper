import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await supabase.rpc("public_feed", { page_size: 50 });
  if (error) return NextResponse.json({ error: "Unable to load feed" }, { status: 400 });
  return NextResponse.json({ posts: data ?? [] });
}