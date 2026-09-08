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

  if (code) await supabase.auth.exchangeCodeForSession(code);
  else if (tokenHash && (type === "email" || type === "recovery")) {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  }

  return NextResponse.redirect(new URL("/home", url.origin));
}