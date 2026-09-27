/**
 * Predefined SChat 24 Avatar Constants
 * Provides 24 vector-rendered Apple Liquid Glass avatars.
 */

const createAvatarSVG = (bg1, bg2, accentColor, eyeType, expression, hat) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#g)" />
    <!-- Outer glass ring highlight -->
    <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" />
    <!-- Character Body -->
    <path d="M22 88 C 22 68, 35 56, 50 56 C 65 56, 78 68, 78 88 Z" fill="${accentColor}" filter="url(#shadow)" opacity="0.95" />
    <!-- Character Head -->
    <circle cx="50" cy="38" r="20" fill="#FFE0BD" filter="url(#shadow)" />
    <!-- Hair / Accessory -->
    ${
      hat === 'cap'
        ? `<path d="M 28 32 C 28 20, 72 20, 72 32 Z" fill="${accentColor}" />
           <rect x="25" y="30" width="30" height="5" rx="2" fill="${accentColor}" />`
        : hat === 'crown'
        ? `<path d="M 32 24 L 38 12 L 50 20 L 62 12 L 68 24 Z" fill="#FBBF24" />`
        : hat === 'glasses'
        ? `<circle cx="43" cy="36" r="6" fill="none" stroke="#1E293B" stroke-width="2" />
           <circle cx="57" cy="36" r="6" fill="none" stroke="#1E293B" stroke-width="2" />
           <line x1="49" y1="36" x2="51" y2="36" stroke="#1E293B" stroke-width="2" />`
        : hat === 'headband'
        ? `<path d="M 30 26 Q 50 22 70 26" fill="none" stroke="${accentColor}" stroke-width="4" stroke-linecap="round" />`
        : hat === 'beanie'
        ? `<path d="M 30 35 C 30 15, 70 15, 70 35 Z" fill="${accentColor}" />
           <circle cx="50" cy="14" r="4" fill="#FFFFFF" />`
        : `<path d="M 32 30 C 32 18, 68 18, 68 30 C 68 22, 32 22, 32 30 Z" fill="#334155" />`
    }
    <!-- Eyes -->
    ${
      eyeType === 'wink'
        ? `<circle cx="43" cy="36" r="2.5" fill="#1E293B" />
           <path d="M 54 36 Q 57 33 60 36" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />`
        : eyeType === 'star'
        ? `<text x="40" y="39" font-size="8" text-anchor="middle" fill="#1E293B">★</text>
           <text x="60" y="39" font-size="8" text-anchor="middle" fill="#1E293B">★</text>`
        : `<circle cx="43" cy="36" r="2.5" fill="#1E293B" />
           <circle cx="57" cy="36" r="2.5" fill="#1E293B" />`
    }
    <!-- Expression / Mouth -->
    ${
      expression === 'smile'
        ? `<path d="M 43 45 Q 50 51 57 45" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />`
        : expression === 'open'
        ? `<path d="M 44 44 Q 50 52 56 44 Z" fill="#E11D48" />`
        : expression === 'cool'
        ? `<path d="M 43 46 Q 50 49 57 46" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />`
        : `<path d="M 44 46 L 56 46" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />`
    }
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AVATARS = [
  { id: 'avatar01', label: 'Classic Blue', image: createAvatarSVG('#2563EB', '#1D4ED8', '#FFFFFF', 'normal', 'smile', 'none') },
  { id: 'avatar02', label: 'Emerald Cap', image: createAvatarSVG('#059669', '#047857', '#10B981', 'normal', 'smile', 'cap') },
  { id: 'avatar03', label: 'Purple Crown', image: createAvatarSVG('#7C3AED', '#6D28D9', '#8B5CF6', 'star', 'open', 'crown') },
  { id: 'avatar04', label: 'Rose Glasses', image: createAvatarSVG('#F43F5E', '#E11D48', '#FB7185', 'normal', 'cool', 'glasses') },
  { id: 'avatar05', label: 'Amber Beanie', image: createAvatarSVG('#D97706', '#B45309', '#F59E0B', 'wink', 'smile', 'beanie') },
  { id: 'avatar06', label: 'Cyan Cool', image: createAvatarSVG('#0891B2', '#0E7490', '#06B6D4', 'normal', 'cool', 'glasses') },
  { id: 'avatar07', label: 'Indigo Royal', image: createAvatarSVG('#4F46E5', '#4338CA', '#6366F1', 'star', 'smile', 'crown') },
  { id: 'avatar08', label: 'Teal Sport', image: createAvatarSVG('#0D9488', '#0F766E', '#14B8A6', 'wink', 'open', 'headband') },
  { id: 'avatar09', label: 'Violet Star', image: createAvatarSVG('#9333EA', '#7E22CE', '#A855F7', 'star', 'smile', 'none') },
  { id: 'avatar10', label: 'Sky Aviator', image: createAvatarSVG('#0284C7', '#0369A1', '#38BDF8', 'normal', 'smile', 'glasses') },
  { id: 'avatar11', label: 'Fuchsia Party', image: createAvatarSVG('#C026D3', '#A21CAF', '#E879F9', 'wink', 'open', 'crown') },
  { id: 'avatar12', label: 'Lime Champ', image: createAvatarSVG('#65A30D', '#4D7C0F', '#84CC16', 'normal', 'smile', 'cap') },
  { id: 'avatar13', label: 'Orange Flare', image: createAvatarSVG('#EA580C', '#C2410C', '#F97316', 'star', 'cool', 'headband') },
  { id: 'avatar14', label: 'Slate Tech', image: createAvatarSVG('#475569', '#334155', '#64748B', 'normal', 'smile', 'glasses') },
  { id: 'avatar15', label: 'Pink Pearl', image: createAvatarSVG('#DB2777', '#BE185D', '#EC4899', 'wink', 'smile', 'none') },
  { id: 'avatar16', label: 'Yellow Sun', image: createAvatarSVG('#CA8A04', '#A16207', '#EAB308', 'star', 'open', 'beanie') },
  { id: 'avatar17', label: 'Ocean Tide', image: createAvatarSVG('#1D4ED8', '#1E40AF', '#3B82F6', 'normal', 'cool', 'headband') },
  { id: 'avatar18', label: 'Forest Warden', image: createAvatarSVG('#15803D', '#166534', '#22C55E', 'normal', 'smile', 'cap') },
  { id: 'avatar19', label: 'Crimson Knight', image: createAvatarSVG('#B91C1C', '#991B1B', '#EF4444', 'wink', 'cool', 'crown') },
  { id: 'avatar20', label: 'Plum Luxe', image: createAvatarSVG('#701A75', '#581C87', '#A21CAF', 'star', 'smile', 'none') },
  { id: 'avatar21', label: 'Mint Fresh', image: createAvatarSVG('#059669', '#065F46', '#34D399', 'normal', 'smile', 'glasses') },
  { id: 'avatar22', label: 'Electric Blue', image: createAvatarSVG('#2563EB', '#1E40AF', '#60A5FA', 'star', 'open', 'headband') },
  { id: 'avatar23', label: 'Sunset Amber', image: createAvatarSVG('#D97706', '#92400E', '#FBBF24', 'wink', 'smile', 'cap') },
  { id: 'avatar24', label: 'Deep Cosmos', image: createAvatarSVG('#312E81', '#1E1B4B', '#4F46E5', 'star', 'smile', 'crown') },
];
