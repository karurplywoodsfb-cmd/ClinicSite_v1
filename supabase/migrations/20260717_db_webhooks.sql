-- supabase/migrations/20260717_db_webhooks.sql
-- ─────────────────────────────────────────────────────────────────
-- Wires the 3 event-driven Edge Functions to their Postgres triggers.
--
-- PREREQUISITE: run 20260717a_vault_setup_RUN_MANUALLY_DO_NOT_COMMIT.sql
-- yourself in the Supabase SQL Editor FIRST (that one contains your
-- actual service_role key and is deliberately excluded from git).
-- This file only ever references that secret by name — the raw key
-- never appears here, so this file is safe to commit.
--
-- Apply with: supabase db push
-- ─────────────────────────────────────────────────────────────────

create extension if not exists pg_net with schema extensions;

-- Generic trigger function: looks up the service_role key from Vault
-- at call-time and POSTs the standard Supabase DB-webhook payload
-- shape ({type, table, schema, record, old_record}) to the target
-- Edge Function URL, which is passed in as the trigger argument.
create or replace function public.call_edge_function()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_url text := TG_ARGV[0];
  auth_key   text;
begin
  select decrypted_secret into auth_key
  from vault.decrypted_secrets
  where name = 'db_webhook_auth';

  perform net.http_post(
    url     := target_url,
    body    := jsonb_build_object(
                 'type', TG_OP,
                 'table', TG_TABLE_NAME,
                 'schema', TG_TABLE_SCHEMA,
                 'record', to_jsonb(NEW),
                 'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
               ),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || auth_key
               ),
    timeout_milliseconds := 5000
  );

  return NEW;
end;
$$;

-- ⚠️ Replace <PROJECT_REF> below with: snawzxebxrzmtxelffjc

-- appointment-trigger: fires on new appointment
drop trigger if exists trg_appointment_trigger on public.appointments;
create trigger trg_appointment_trigger
  after insert on public.appointments
  for each row
  execute function public.call_edge_function('https://<PROJECT_REF>.functions.supabase.co/appointment-trigger');

-- feedback-alert: fires on new private (1-3★) feedback
drop trigger if exists trg_feedback_alert on public.feedback;
create trigger trg_feedback_alert
  after insert on public.feedback
  for each row
  when (new.route = 'private')
  execute function public.call_edge_function('https://<PROJECT_REF>.functions.supabase.co/feedback-alert');

-- queue-notify: fires on any queue_tokens update (the function itself
-- filters down to only "just skipped" / "just snoozed" cases)
drop trigger if exists trg_queue_notify on public.queue_tokens;
create trigger trg_queue_notify
  after update on public.queue_tokens
  for each row
  execute function public.call_edge_function('https://<PROJECT_REF>.functions.supabase.co/queue-notify');

-- NOTE: send-sms-hook is an Auth Hook, not a Database Webhook — it can't
-- be wired via SQL trigger. That one still needs the Dashboard step
-- documented in supabase/functions/send-sms-hook/index.ts (Authentication
-- → Hooks → Send SMS hook → paste the deployed function URL).

