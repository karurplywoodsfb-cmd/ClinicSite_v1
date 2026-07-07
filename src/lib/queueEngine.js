// src/lib/queueEngine.js
// Pure functions for the Live Token Status system.
// No API calls here — supabase.js wires these to real data.

/**
 * Rolling average consult length, based on the last N completed tokens.
 * Falls back to the clinic's configured default if there isn't enough history.
 * @param {Array}  recentDoneTokens — tokens with status 'done', called_at, done_at
 * @param {number} fallbackMinutes — clinic.avg_appt_minutes_default
 * @param {number} sampleSize      — how many recent tokens to average (default 10)
 * @returns {number} minutes
 */
export function getRollingAvgMinutes(recentDoneTokens = [], fallbackMinutes = 15, sampleSize = 10) {
  const withDurations = recentDoneTokens
    .filter(t => t.called_at && t.done_at)
    .slice(-sampleSize)
    .map(t => (new Date(t.done_at) - new Date(t.called_at)) / 60000)
    .filter(mins => mins > 0 && mins < 120); // discard bad data (negative or absurdly long)

  if (withDurations.length < 3) return fallbackMinutes; // not enough real data yet
  const avg = withDurations.reduce((a, b) => a + b, 0) / withDurations.length;
  return Math.round(avg);
}

/**
 * ETA in minutes for a given waiting token, based on how many people are ahead of it.
 * @param {Object} token          — the token to estimate for
 * @param {Array}  waitingQueue   — all 'waiting' tokens for today, sorted by position asc
 * @param {number} avgMinutes     — rolling average consult length
 * @returns {number} minutes until this token is likely to be called
 */
export function getEtaMinutes(token, waitingQueue, avgMinutes) {
  const ahead = waitingQueue.filter(t => t.position < token.position).length;
  return ahead * avgMinutes;
}

/**
 * Should we fire the "leave now" travel alert for this token?
 * True the moment ETA drops to (or below) the patient's stated travel time,
 * and we haven't already sent it.
 */
export function shouldFireTravelAlert(token, etaMinutes) {
  if (!token.travel_minutes || token.travel_alert_sent) return false;
  return etaMinutes <= token.travel_minutes;
}

/**
 * Compute new positions after a "Snooze +2" action:
 * the snoozed token is pushed back exactly 2 places among currently-waiting tokens
 * (not sent to the bottom of the tray — that's Skip's job).
 * @param {Array} waitingQueue — sorted by position asc, includes the target token
 * @param {string} tokenId
 * @returns {Array<{id, position}>} position updates to apply
 */
export function computeSnoozePositions(waitingQueue, tokenId) {
  const sorted = [...waitingQueue].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex(t => t.id === tokenId);
  if (idx === -1) return [];

  const target = sorted[idx];
  const swapWith = sorted.slice(idx + 1, idx + 3); // the next 2 tokens ahead in time
  if (swapWith.length === 0) return []; // already at/near the back, nothing to snooze past

  // Target takes the position of the last of the 2 it's jumping behind;
  // those 1-2 tokens each move up by one slot.
  const updates = swapWith.map((t, i) => ({ id: t.id, position: target.position + i }));
  updates.push({ id: target.id, position: swapWith[swapWith.length - 1].position });
  return updates;
}

/**
 * Compute the position for "one-click resurrection" of a skipped token:
 * reinserts them as next-in-line (right after whoever is currently being served).
 * @param {Array} waitingQueue — sorted by position asc (does NOT include the skipped token)
 * @returns {number} the position value to assign
 */
export function computeResurrectPosition(waitingQueue) {
  if (waitingQueue.length === 0) return 1;
  const minPos = Math.min(...waitingQueue.map(t => t.position));
  return minPos - 1; // ahead of everyone currently waiting
}

/**
 * Compute the position for a brand-new token (walk-in or check-in) — goes to the back.
 */
export function computeNewTokenPosition(waitingQueue) {
  if (waitingQueue.length === 0) return 1;
  return Math.max(...waitingQueue.map(t => t.position)) + 1;
}

/**
 * Next token number for today (sequential, per clinic, resets daily via queue_date).
 */
export function getNextTokenNumber(todaysTokens) {
  if (todaysTokens.length === 0) return 1;
  return Math.max(...todaysTokens.map(t => t.token_number)) + 1;
}
