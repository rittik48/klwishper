import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackError = url.searchParams.get("error_description");
  if (callbackError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(callbackError)}`, url.origin));
  }
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }
  else if (tokenHash && (type === "email" || type === "recovery")) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?error=Sign-in+could+not+be+completed", url.origin));
  if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", url.origin));
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  return NextResponse.redirect(new URL(profile ? "/home" : "/onboarding", url.origin));
}