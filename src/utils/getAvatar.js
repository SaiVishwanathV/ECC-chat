import { AVATARS } from '../constants/avatars';

/**
 * Retrieves matching avatar image data URI for a given avatar ID.
 * Fallback to 'avatar01' if ID is invalid or missing.
 * @param {string} avatarId
 * @returns {string} Image source URL/data URI
 */
export function getAvatar(avatarId) {
  if (!avatarId) return AVATARS[0].image;

  // If avatarId is already an HTTP URL or data URI, return as-is
  if (avatarId.startsWith('http') || avatarId.startsWith('data:image')) {
    return avatarId;
  }

  const found = AVATARS.find((item) => item.id === avatarId);
  return found ? found.image : AVATARS[0].image;
}
