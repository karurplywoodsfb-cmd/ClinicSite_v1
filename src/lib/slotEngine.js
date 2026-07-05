// src/lib/slotEngine.js
// Generates available time slots from clinic working hours.
// Called by BookingEngine — replaces hardcoded TIME_SLOTS array.
// This is a zero-dependency pure function — no API calls needed.

const SLOT_INTERVAL_MINS = 30; // configurable per clinic in future

/**
 * Convert "HH:MM" (24h) to minutes since midnight.
 */
function toMins(time24) {
  if (!time24) return null;
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes since midnight to "H:MM AM/PM" display format.
 */
function toDisplay(mins) {
  const h    = Math.floor(mins / 60);
  const m    = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr   = h % 12 || 12;
  return `${hr}${m ? `:${String(m).padStart(2, "0")}` : ":00"} ${ampm}`;
}

/**
 * Get slots available for a given date based on working hours.
 * @param {Array}  workingHours — from getWorkingHours(clinicId)
 * @param {Date}   date         — the selected date
 * @returns {string[]}          — array of display strings e.g. ["9:00 AM", "9:30 AM"]
 */
export function getSlotsForDate(workingHours, date) {
  if (!workingHours || workingHours.length === 0) {
    return getDefaultSlots();
  }

  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  const dayHours  = workingHours.find(h => h.day_of_week === dayOfWeek);

  // Clinic closed on this day
  if (!dayHours || !dayHours.is_open) return [];

  const openMins  = toMins(dayHours.open_time  || "09:00");
  const closeMins = toMins(dayHours.close_time || "18:00");
  if (openMins === null || closeMins === null) return getDefaultSlots();

  // Generate slots every 30 minutes
  const slots = [];
  for (let m = openMins; m + SLOT_INTERVAL_MINS <= closeMins; m += SLOT_INTERVAL_MINS) {
    // Skip lunch break 1:00 PM - 2:00 PM (common in Indian clinics)
    if (m >= 780 && m < 840) continue; // 13:00 - 14:00
    slots.push(toDisplay(m));
  }
  return slots;
}

/**
 * Fallback slots when no working hours are configured.
 */
function getDefaultSlots() {
  return [
    "9:00 AM","9:30 AM","10:00 AM","10:30 AM",
    "11:00 AM","11:30 AM","12:00 PM",
    "2:00 PM","2:30 PM","3:00 PM","3:30 PM",
    "4:00 PM","4:30 PM","5:00 PM","5:30 PM",
    "6:00 PM","6:30 PM","7:00 PM","7:30 PM",
  ];
}

/**
 * Find the next available slot across the next N days.
 * Used to show "Next available: Today 3:30 PM" headline.
 * @param {Array}  workingHours
 * @param {Array}  takenSlotsMap — { "2024-01-15": ["9:00 AM", "10:00 AM"] }
 * @param {number} daysAhead     — how many days to look ahead (default 7)
 * @returns {{ date: Date, slot: string, label: string } | null}
 */
export function findNextAvailable(workingHours, takenSlotsMap = {}, daysAhead = 7) {
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < daysAhead; i++) {
    const date    = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dateStr   = date.toISOString().split("T")[0];
    const slots     = getSlotsForDate(workingHours, date);
    const taken     = takenSlotsMap[dateStr] || [];
    const isToday   = i === 0;

    for (const slot of slots) {
      if (taken.includes(slot)) continue;

      // If today, only show future slots (at least 30 mins from now)
      if (isToday) {
        const [time, ampm] = slot.split(" ");
        const [h, m]       = time.split(":").map(Number);
        let   hour         = h;
        if (ampm === "PM" && h !== 12) hour += 12;
        if (ampm === "AM" && h === 12) hour  = 0;
        const slotMins = hour * 60 + (m || 0);
        if (slotMins <= nowMins + 30) continue;
      }

      const label = isToday
        ? `Today at ${slot}`
        : i === 1
        ? `Tomorrow at ${slot}`
        : `${date.toLocaleDateString("en-IN", { weekday:"long" })} at ${slot}`;

      return { date, slot, label };
    }
  }
  return null; // fully booked for next N days
}
