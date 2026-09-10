import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roomSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { error: profileError } = await supabase.from("profiles").upsert(
    { id: user.id, department: "Undeclared", year: "Undeclared" },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (profileError) {
    console.error("Group profile bootstrap failed", profileError);
    return NextResponse.json({ error: "Your profile is not ready. Sign out and sign in again, then retry." }, { status: 400 });
  }
  if (!rateLimit(`room:${user.id}`, 3).allowed) return NextResponse.json({ error: "Group creation limit reached" }, { status: 429 });
  const parsed = roomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid group details" }, { status: 400 });
  const { allowJoin, ...roomData } = parsed.data;
  const { data, error } = await supabase.from("rooms").insert({ ...roomData, allow_join: allowJoin, owner_id: user.id }).select("id, name, description, type, owner_id, visibility, discoverable, allow_join").single();
  if (error) {
    console.error("Create group failed", error);
    const message = error.code === "23505"
      ? "A group with this name already exists"
      : error.code === "42501"
        ? "You do not have permission to create this group. Apply the latest database migration."
        : `Unable to create group (${error.code ?? "database error"}): ${error.message}`;
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { error: membershipError } = await supabase.from("room_members").insert({ room_id: data.id, user_id: user.id, status: "approved" });
  if (membershipError) {
    console.error("Add group owner membership failed", membershipError);
    await supabase.from("rooms").delete().eq("id", data.id).eq("owner_id", user.id);
    return NextResponse.json({ error: "Group was not created because membership setup failed. Apply the latest database migration." }, { status: 400 });
  }
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

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const { data, error } = await supabase.rpc("search_public_rooms", { search_term: query });
  if (error) return NextResponse.json({ error: "Unable to search groups" }, { status: 400 });
  return NextResponse.json({ rooms: data ?? [] });
}
