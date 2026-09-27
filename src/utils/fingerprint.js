/**
 * Formats a hex fingerprint into 4-character blocks for high readability.
 * Example: "A1B2C3D4E5F67890" -> "A1B2 C3D4 E5F6 7890"
 * @param {string} hex
 * @returns {string}
 */
export function formatFingerprint(hex) {
  if (!hex) return '';
  const cleanHex = hex.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const chunks = cleanHex.match(/.{1,4}/g) || [];
  return chunks.join(' ');
}
