import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";

function anonymousLabel() {
  return `Anonymous #${randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
  const { data, error } = await supabase.from("profiles").select("anonymous_label, department, year").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load profile" }, { status: 400 });
  return NextResponse.json({ profile: data });
}

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });
  const label = anonymousLabel();
  const { data, error } = await supabase.from("profiles").update({ anonymous_label: label }).eq("id", user.id).select("anonymous_label").single();
  if (error) return NextResponse.json({ error: "Unable to refresh anonymous name" }, { status: 400 });
  return NextResponse.json({ profile: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Department and year are required" }, { status: 400 });
  const { data, error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data }, { onConflict: "id" }).select("id, anonymous_label, department, year").single();
  if (error) return NextResponse.json({ error: "Unable to save profile" }, { status: 400 });
  return NextResponse.json({ profile: data });
}
