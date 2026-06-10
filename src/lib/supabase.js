// src/lib/supabase.js
// Supabase client + all API functions
// Auth: Email OTP (FREE — no Twilio, no SMS cost)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════
// AUTH — Email OTP (free, built into Supabase)
// ═══════════════════════════════════════════════════

// Send 6-digit OTP to email
export async function sendEmailOTP(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
  return true;
}

// Verify the OTP entered by user
export async function verifyEmailOTP(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

// Get current logged-in user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Sign out
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
    .single();
  if (error) throw error;
  return data;
}

export async function getClinicBySlug(slug) {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) throw error;
  return data;
}

export async function updateClinic(clinicId, updates) {
  const { data, error } = await supabase
    .from('clinics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', clinicId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishClinic(clinicId, publish = true) {
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
  return data;
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
  return data;
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
  return data;
}

export async function bookAppointment(clinicId, appointment) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id:    clinicId,
      patient_name: appointment.name,
      phone:        appointment.phone,
      email:        appointment.email || null,
      service:      appointment.service,
      appt_date:    appointment.date,
      appt_time:    appointment.time || null,
      notes:        appointment.notes || null,
      status:       'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data;
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
// REVIEWS
// ═══════════════════════════════════════════════════

export async function getReviews(clinicId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function toggleReview(reviewId, isVisible) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible })
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// SEO
// ═══════════════════════════════════════════════════

export async function getSeoData(clinicId) {
  const { data, error } = await supabase
    .from('seo_data')
    .select('*')
    .eq('clinic_id', clinicId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertSeoData(clinicId, seo) {
  const { data, error } = await supabase
    .from('seo_data')
    .upsert({ clinic_id: clinicId, ...seo, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════
// REALTIME — live appointment updates in admin
// ═══════════════════════════════════════════════════

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
