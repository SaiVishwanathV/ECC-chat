/**
 * Formats a Firestore timestamp or JS Date/number into a concise message time string (e.g. "10:45 AM").
 * @param {object|number|Date} timestamp
 * @returns {string}
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


/**
 * Formats date into a full string (e.g. "Sep 27, 2026").
 * @param {object|number|Date} timestamp
 * @returns {string}
 */
export function formatFullDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
