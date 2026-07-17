// supabase/functions/invite-staff/index.ts
// ─────────────────────────────────────────────────────────────────
// Called from the browser (via lib/supabase.js:inviteStaffMember).
// Runs with the service-role key because creating an auth user via
// admin.inviteUserByEmail requires it — that key must never reach the client.
//
// Deploy: supabase functions deploy invite-staff
// (No DB webhook needed — this one's called directly over HTTP, like a
// regular API endpoint, using the caller's own JWT for authorization.)
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const VALID_ROLES = ["doctor", "nurse", "receptionist", "accountant"];

serve(async (req) => {
  try {
    // 1. Identify the caller from their JWT (passed as Bearer token).
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });
    }

    const { clinicId, email, name, role, doctorId } = await req.json();

    if (!clinicId || !email || !role) {
      return new Response(JSON.stringify({ error: "clinicId, email, and role are required." }), { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }), { status: 400 });
    }

    // 2. Verify the caller actually owns this clinic — the edge function
    //    runs as service-role, so this check replaces what RLS would
    //    otherwise enforce automatically.
    const { data: clinic, error: clinicErr } = await admin
      .from("clinics")
      .select("id, owner_id, name")
      .eq("id", clinicId)
      .single();

    if (clinicErr || !clinic || clinic.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the clinic owner can invite staff." }), { status: 403 });
    }

    // 3. Create (or reuse) the auth user and send them an invite email.
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_clinic: clinicId, role },
    });

    // inviteUserByEmail errors if the user already exists — that's fine,
    // they may already have an account (e.g. from another clinic); look them up instead.
    let userId = invited?.user?.id;
    if (inviteErr && !userId) {
      const { data: existing } = await admin.auth.admin.listUsers();
      const match = existing?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!match) {
        return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400 });
      }
      userId = match.id;
    }

    // 4. Insert the clinic_staff row.
    const { data: staffRow, error: staffErr } = await admin
      .from("clinic_staff")
      .upsert(
        { clinic_id: clinicId, user_id: userId, email, name, role, doctor_id: doctorId || null, active: true },
        { onConflict: "clinic_id,email" }
      )
      .select()
      .single();

    if (staffErr) {
      return new Response(JSON.stringify({ error: staffErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ data: staffRow }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("invite-staff error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
