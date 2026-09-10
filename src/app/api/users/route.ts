import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ users: [] });
  const { data, error } = await supabase.rpc("search_anonymous_users", { search_term: query });
  if (error) return NextResponse.json({ error: "Unable to search users" }, { status: 400 });
  return NextResponse.json({ users: data ?? [] });
}
