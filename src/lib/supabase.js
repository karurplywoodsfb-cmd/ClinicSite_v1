// src/lib/supabase.js
// Fixes:
//   - getSeoData: use .maybeSingle() instead of .single() → no 406 when row missing
//   - getClinicBySlug: graceful null return instead of throw
//   - getMyClinic: graceful null return on PGRST116
//   - publishClinic: blocks publish if reg_number missing
//   - bookAppointment: includes DPDP consent fields

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════
// AUTH — Email OTP (free, no Twilio)
// ═══════════════════════════════════════════════════

export async function sendEmailOTP(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
  return true;
}

export async function verifyEmailOTP(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });
  if (error) throw error;
  return data;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ═══════════════════════════════════════════════════
// CLINIC
// ═══════════════════════════════════════════════════

export async function getMyClinic() {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();               // ← maybeSingle: returns null (not error) if no row
  if (error) throw error;
  return data;                    // null if no clinic yet → triggers OnboardingWizard
}

export async function getClinicBySlug(slug) {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();               // ← no 406 when clinic not found
  if (error) throw error;
  return data;                    // null if not found — caller checks
}

// Get clinic by slug regardless of publish status (for admin preview)
export async function getClinicBySlugAny(slug) {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateClinic(clinicId, updates) {
  // Strip undefined values before sending to Supabase
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  const { data, error } = await supabase
    .from('clinics')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', clinicId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishClinic(clinicId, publish = true) {
  // Block publish if reg_number is missing (compliance D1)
  if (publish) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('reg_number')
      .eq('clinic_id', clinicId)
      .maybeSingle();
    if (!doctor?.reg_number) {
      throw new Error(
        'Cannot publish: Medical Council Registration Number is missing.\n' +
        'Go to Doctor Profile → add your Reg No.\n' +
        'Required by IMC Ethics Regulations, 2002.'
      );
    }
  }
  return updateClinic(clinicId, { is_published: publish });
}

// ═══════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════

export async function getServices(clinicId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function updateService(serviceId, updates) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addService(clinicId, service) {
  const { data, error } = await supabase
    .from('services')
    .insert({ clinic_id: clinicId, ...service })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(serviceId) {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════

export async function getDoctors(clinicId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function updateDoctor(doctorId, updates) {
  const { data, error } = await supabase
    .from('doctors')
    .update(updates)
    .eq('id', doctorId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadDoctorPhoto(clinicId, file) {
  const ext  = file.name.split('.').pop();
  const path = `${clinicId}/doctor-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('clinic-assets')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('clinic-assets').getPublicUrl(path);
  return data.publicUrl;
}

// ═══════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════

export async function getAppointments(clinicId, status = null) {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('appt_date', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Return the list of already-booked time slots for a clinic on a given date.
 * Used by BookingEngine to show real availability (no hardcoded data).
 * @param {string} clinicId
 * @param {string} dateStr  — YYYY-MM-DD
 * @returns {string[]} e.g. ["9:00 AM", "11:30 AM"]
 */
export async function getTakenSlots(clinicId, dateStr) {
  if (!clinicId || !dateStr) return [];
  const { data, error } = await supabase
    .from("appointments")
    .select("appt_time")
    .eq("clinic_id", clinicId)
    .eq("appt_date", dateStr)
    .not("status", "in", '("cancelled","no_show")');
  if (error) { console.error("getTakenSlots:", error.message); return []; }
  return (data || []).map(r => r.appt_time).filter(Boolean);
}

/**
 * Check whether a clinic's plan still allows new appointments this calendar month.
 * Called from the public-facing BookingEngine (no user session required).
 * @param {string} clinicId
 * @returns {{ canBook: boolean, currentCount: number, limit: number }}
 */
export async function checkClinicAppointmentLimit(clinicId) {
  // 1. Get clinic's current plan
  const { data: clinic, error: cErr } = await supabase
    .from("clinics")
    .select("plan")
    .eq("id", clinicId)
    .maybeSingle();
  if (cErr || !clinic) return { canBook: true, currentCount: 0, limit: 999999 }; // fail open

  // 2. Get this month's confirmed/pending appointment count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error: aErr } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .not("status", "in", '("cancelled","no_show")')
    .gte("created_at", startOfMonth.toISOString());

  if (aErr) return { canBook: true, currentCount: 0, limit: 999999 };

  // 3. Compare against plan limit (import dynamically to avoid circular deps)
  const { PLAN_FEATURES } = await import("../config/planConfig");
  const feature = PLAN_FEATURES.find(f => f.name === "appointments_monthly");
  const plan    = clinic.plan || "free";
  const limit   = feature ? Number(feature[plan]) : 50;
  const current = count ?? 0;

  return { canBook: current < limit, currentCount: current, limit };
}

export async function bookAppointment(clinicId, appointment) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id:               clinicId,
      branch_id:               appointment.branch_id    || null,
      doctor_id:               appointment.doctor_id    || null,
      patient_name:            appointment.name,
      phone:                   appointment.phone,
      email:                   appointment.email        || null,
      service:                 appointment.service,
      appt_date:               appointment.date,
      appt_time:               appointment.time         || null,
      notes:                   appointment.notes        || null,
      status:                  'pending',
      // DPDP Act 2023 — consent audit trail
      consent_appointment:     appointment.consent_appointment    ?? true,
      consent_communications:  appointment.consent_communications ?? true,
      consent_timestamp:       appointment.consent_timestamp      || new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Doctor-scoped appointments — used so a 'doctor' role only ever queries
// their own calendar (RLS also enforces this server-side, this just keeps
// the query itself efficient rather than fetching-then-filtering client-side).
export async function getAppointmentsForDoctor(clinicId, doctorId, dateFrom, dateTo) {
  let q = supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('appt_date', { ascending: true });
  if (doctorId) q = q.eq('doctor_id', doctorId);
  if (dateFrom) q = q.gte('appt_date', dateFrom);
  if (dateTo)   q = q.lte('appt_date', dateTo);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// WORKING HOURS
// ═══════════════════════════════════════════════════

export async function getWorkingHours(clinicId) {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function updateWorkingHour(hourId, updates) {
  const { data, error } = await supabase
    .from('working_hours')
    .update(updates)
    .eq('id', hourId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// CLINIC MEDIA (replaces reviews — compliance B1/B3)
// ═══════════════════════════════════════════════════

export async function getClinicMedia(clinicId) {
  const { data, error } = await supabase
    .from('clinic_media')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function addClinicMedia(clinicId, item) {
  const { data, error } = await supabase
    .from('clinic_media')
    .insert({ clinic_id: clinicId, ...item })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClinicMedia(itemId) {
  const { error } = await supabase.from('clinic_media').delete().eq('id', itemId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════
// SEO — maybeSingle fixes 406 when no row exists
// ═══════════════════════════════════════════════════

export async function getSeoData(clinicId) {
  const { data, error } = await supabase
    .from('seo_data')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle();               // ← KEY FIX: no 406 error when row doesn't exist yet
  // error is null when row missing with maybeSingle
  if (error) {
    console.warn('getSeoData error (non-critical):', error.message);
    return null;                  // graceful fallback — caller uses auto-generated SEO
  }
  return data;                    // null if no row yet — perfectly fine
}

export async function upsertSeoData(clinicId, seo) {
  const { data, error } = await supabase
    .from('seo_data')
    .upsert(
      { clinic_id: clinicId, ...seo, updated_at: new Date().toISOString() },
      { onConflict: 'clinic_id' }  // ← explicit conflict target prevents duplicate inserts
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// BLOG POSTS
// ═══════════════════════════════════════════════════

export async function getBlogPosts(clinicId, { publishedOnly = false } = {}) {
  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, word_count, status, created_at, views, specialty')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });
  if (publishedOnly) query = query.eq('status', 'published');
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBlogPost(clinicId, slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('slug', slug)
    .maybeSingle();               // ← no 406 when post not found
  if (error) throw error;
  // Increment view count (fire and forget — don't await)
  if (data?.id) {
    supabase.rpc('increment_blog_views', { post_id: data.id }).catch(() => {});
  }
  return data;
}

export async function saveBlogPost(clinicId, post) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ clinic_id: clinicId, ...post })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBlogPost(postId, updates) {
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// PRIVACY POLICY
// ═══════════════════════════════════════════════════

export async function getPrivacyPolicy(clinicId) {
  const { data, error } = await supabase
    .from('privacy_policies')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle();               // ← no 406 when not generated yet
  if (error) {
    console.warn('getPrivacyPolicy:', error.message);
    return null;
  }
  return data;
}

export async function upsertPrivacyPolicy(clinicId, content) {
  const { data, error } = await supabase
    .from('privacy_policies')
    .upsert(
      { clinic_id: clinicId, content, last_updated: new Date().toISOString() },
      { onConflict: 'clinic_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// REALTIME — live appointment feed in admin
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// FEEDBACK (Review Filter Funnel — Phase 1)
// ═══════════════════════════════════════════════════

// Public insert — called from /:slug/feedback, no auth required.
// route: 'public' (4-5★, sent toward Google) | 'private' (1-3★, owner-only)
export async function submitFeedback(clinicId, { rating, comment, patientName, patientPhone }) {
  const route = rating >= 4 ? 'public' : 'private';
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      clinic_id: clinicId,
      rating,
      comment: comment || null,
      patient_name: patientName || null,
      patient_phone: patientPhone || null,
      route,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Admin-only — private (1-3★) complaints for the receptionist/owner inbox.
export async function getPrivateFeedback(clinicId, status = null) {
  let q = supabase
    .from('feedback')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('route', 'private')
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateFeedbackStatus(feedbackId, status) {
  const { data, error } = await supabase
    .from('feedback')
    .update({ status })
    .eq('id', feedbackId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// LIVE TOKEN QUEUE (Phase 2)
// ═══════════════════════════════════════════════════

const todayStr = () => new Date().toISOString().split("T")[0];

// Public — used by /:slug/live. Reads the narrow view (no patient PII).
export async function getPublicQueue(clinicId) {
  const { data, error } = await supabase
    .from("queue_public_view")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Admin/receptionist — full queue including patient name/phone.
export async function getTodayQueue(clinicId) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("queue_date", todayStr())
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Last N completed tokens, used to compute the rolling ETA average.
export async function getRecentDoneTokens(clinicId, limit = 15) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .select("called_at, done_at")
    .eq("clinic_id", clinicId)
    .eq("status", "done")
    .order("done_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function addQueueToken(clinicId, { patientName, patientPhone, position, tokenNumber, branchId = null, appointmentId = null }) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .insert({
      clinic_id: clinicId,
      branch_id: branchId,
      appointment_id: appointmentId,
      queue_date: todayStr(),
      token_number: tokenNumber,
      patient_name: patientName,
      patient_phone: patientPhone,
      status: "waiting",
      position,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Bulk position update — used after Snooze / Resurrect reshuffle.
export async function updateTokenPositions(updates) {
  // Supabase JS has no native bulk-update-by-id, so fire them in parallel.
  await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from("queue_tokens").update({ position }).eq("id", id)
    )
  );
}

export async function callNextToken(tokenId) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .update({ status: "serving", called_at: new Date().toISOString() })
    .eq("id", tokenId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markTokenDone(tokenId) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("id", tokenId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function skipToken(tokenId, currentSkippedCount = 0) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .update({ status: "skipped", skipped_count: currentSkippedCount + 1 })
    .eq("id", tokenId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// One-click resurrection — brings a skipped token back as next-in-line.
export async function resurrectToken(tokenId, newPosition) {
  const { data, error } = await supabase
    .from("queue_tokens")
    .update({ status: "waiting", position: newPosition })
    .eq("id", tokenId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Patient sets their travel time from the public /live page — via RPC, so
// anonymous visitors never get write access to the base table (see migration).
export async function setTravelAlert(tokenId, minutes) {
  const { error } = await supabase.rpc("set_travel_alert", { p_token_id: tokenId, p_minutes: minutes });
  if (error) throw error;
}

// Realtime subscription — both the receptionist dashboard and the public
// /live page use this so calling next / skipping / snoozing updates instantly.
export function subscribeToQueue(clinicId, callback) {
  const channel = supabase
    .channel(`queue-${clinicId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_tokens", filter: `clinic_id=eq.${clinicId}` },
      callback
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ═══════════════════════════════════════════════════
// STAFF / RBAC (Phase 3)
// ═══════════════════════════════════════════════════

export async function getClinicStaff(clinicId) {
  const { data, error } = await supabase
    .from("clinic_staff")
    .select("*, doctors(name)")
    .eq("clinic_id", clinicId)
    .order("invited_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Invites go through an edge function because creating the auth user
// requires the service-role key (not something the browser should hold).
export async function inviteStaffMember(clinicId, { email, name, role, doctorId }) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ clinicId, email, name, role, doctorId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not invite staff member.");
  return json.data;
}

export async function updateStaffMember(staffId, updates) {
  const { data, error } = await supabase
    .from("clinic_staff")
    .update(updates)
    .eq("id", staffId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeStaffMember(staffId) {
  const { error } = await supabase.from("clinic_staff").delete().eq("id", staffId);
  if (error) throw error;
}

export async function addDoctor(clinicId, doctor) {
  const { data, error } = await supabase
    .from("doctors")
    .insert({ clinic_id: clinicId, is_active: true, ...doctor })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToAppointments(clinicId, callback) {
  const channel = supabase
    .channel(`appointments-${clinicId}`)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'appointments',
      filter: `clinic_id=eq.${clinicId}`,
    }, (payload) => callback(payload))
    .subscribe();
  return () => supabase.removeChannel(channel);
}