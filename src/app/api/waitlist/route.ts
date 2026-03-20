import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tools, instrument } = body as {
      email?: string;
      tools?: string;
      instrument?: string;
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Fallback when Supabase is not configured
      const referralCode = createHash("sha256")
        .update(email + Date.now())
        .digest("hex")
        .slice(0, 8);
      return NextResponse.json({ position: 1, referralCode });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check for existing entry
    const { data: existing } = await supabase
      .from("waitlist")
      .select("position, referral_code")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({
        position: existing.position,
        referralCode: existing.referral_code,
        existing: true,
      });
    }

    // Get current count for position
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    const position = (count ?? 0) + 1;
    const referralCode = createHash("sha256")
      .update(email + Date.now())
      .digest("hex")
      .slice(0, 8);

    const { error } = await supabase.from("waitlist").insert({
      email,
      tools: tools || null,
      instrument: instrument || null,
      referral_code: referralCode,
      position,
    });

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        const { data: race } = await supabase
          .from("waitlist")
          .select("position, referral_code")
          .eq("email", email)
          .single();
        return NextResponse.json({
          position: race?.position ?? position,
          referralCode: race?.referral_code ?? referralCode,
          existing: true,
        });
      }
      throw error;
    }

    return NextResponse.json({ position, referralCode });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
