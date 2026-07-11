import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://lavanderiajl.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await request.json() as { profile_id?: unknown; pin?: unknown };
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!/^[0-9a-f-]{36}$/.test(profileId) || !/^\d{6}$/.test(pin)) {
      return new Response(JSON.stringify({ status: "incorrect" }), { status: 400, headers: corsHeaders });
    }
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return new Response(JSON.stringify({ status: "session_error" }), { status: 500, headers: corsHeaders });
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const verification = await admin.rpc("operator_pin_login", { p_profile_id: profileId, p_pin: pin });
    if (verification.error || !verification.data || verification.data.status !== "success") {
      return new Response(JSON.stringify({ status: verification.error ? "session_error" : verification.data?.status ?? "incorrect" }), { status: 401, headers: corsHeaders });
    }
    const email = verification.data.email as string;
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) return new Response(JSON.stringify({ status: "session_error" }), { status: 500, headers: corsHeaders });
    const session = await admin.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (session.error || !session.data.session) return new Response(JSON.stringify({ status: "session_error" }), { status: 500, headers: corsHeaders });
    return new Response(JSON.stringify({ status: "success", session: session.data.session }), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ status: "session_error" }), { status: 500, headers: corsHeaders });
  }
});
