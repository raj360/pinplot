import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProfileAfterAuth } from "@/lib/auth/sync-profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/explore";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "magiclink" | "recovery" | "invite",
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const destination = next.startsWith("/") ? next : `/${next}`;

  if (session?.access_token) {
    await syncProfileAfterAuth(session.access_token);
  }

  const completeProfileUrl = `/auth/complete-profile?next=${encodeURIComponent(destination)}`;
  return NextResponse.redirect(`${origin}${completeProfileUrl}`);
}
