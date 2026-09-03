/**
 * Country dial codes.
 *
 * `nsnMin`/`nsnMax` are the national significant number lengths, the digits
 * after the dial code. They come from the ITU E.164 national numbering plans
 * and let us validate "is this a plausible number for this country" without
 * pulling in libphonenumber, which is ~500KB and overkill for a signup field.
 *
 * The server must still validate properly before sending an SMS. This is a
 * courtesy check that catches typos, not an authority.
 */
export interface Country {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  nsnMin: number;
  nsnMax: number;
}

export const COUNTRIES: Country[] = [
  { iso: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', nsnMin: 10, nsnMax: 10 },
  { iso: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', nsnMin: 9, nsnMax: 9 },
  { iso: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', nsnMin: 9, nsnMax: 9 },
  { iso: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', nsnMin: 9, nsnMax: 9 },
  { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', nsnMin: 10, nsnMax: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', nsnMin: 10, nsnMax: 10 },
  { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', nsnMin: 10, nsnMax: 10 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', nsnMin: 9, nsnMax: 9 },
  { iso: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴', nsnMin: 9, nsnMax: 9 },
  { iso: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', nsnMin: 10, nsnMax: 10 },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', nsnMin: 9, nsnMax: 9 },
  { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹', nsnMin: 10, nsnMax: 13 },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩', nsnMin: 10, nsnMax: 10 },
  { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪', nsnMin: 9, nsnMax: 9 },
  { iso: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯', nsnMin: 8, nsnMax: 8 },
  { iso: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼', nsnMin: 8, nsnMax: 8 },
  { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', nsnMin: 10, nsnMax: 11 },
  { iso: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫', nsnMin: 8, nsnMax: 8 },
  { iso: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲', nsnMin: 9, nsnMax: 9 },
  { iso: 'CV', name: 'Cape Verde', dial: '+238', flag: '🇨🇻', nsnMin: 7, nsnMax: 7 },
  { iso: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫', nsnMin: 8, nsnMax: 8 },
  { iso: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩', nsnMin: 8, nsnMax: 8 },
  { iso: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', nsnMin: 9, nsnMax: 9 },
  { iso: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', nsnMin: 11, nsnMax: 11 },
  { iso: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', nsnMin: 10, nsnMax: 10 },
  { iso: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬', nsnMin: 9, nsnMax: 9 },
  { iso: 'CD', name: 'Congo (DRC)', dial: '+243', flag: '🇨🇩', nsnMin: 9, nsnMax: 9 },
  { iso: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮', nsnMin: 10, nsnMax: 10 },
  { iso: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', nsnMin: 8, nsnMax: 8 },
  { iso: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', nsnMin: 10, nsnMax: 10 },
  { iso: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹', nsnMin: 9, nsnMax: 9 },
  { iso: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', nsnMin: 9, nsnMax: 10 },
  { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', nsnMin: 9, nsnMax: 9 },
  { iso: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲', nsnMin: 7, nsnMax: 7 },
  { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', nsnMin: 10, nsnMax: 11 },
  { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷', nsnMin: 10, nsnMax: 10 },
  { iso: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳', nsnMin: 9, nsnMax: 9 },
  { iso: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰', nsnMin: 8, nsnMax: 8 },
  { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', nsnMin: 10, nsnMax: 10 },
  { iso: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩', nsnMin: 9, nsnMax: 12 },
  { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', nsnMin: 9, nsnMax: 9 },
  { iso: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', nsnMin: 9, nsnMax: 9 },
  { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', nsnMin: 9, nsnMax: 10 },
  { iso: 'JM', name: 'Jamaica', dial: '+1876', flag: '🇯🇲', nsnMin: 7, nsnMax: 7 },
  { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', nsnMin: 10, nsnMax: 10 },
  { iso: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴', nsnMin: 9, nsnMax: 9 },
  { iso: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷', nsnMin: 8, nsnMax: 9 },
  { iso: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾', nsnMin: 9, nsnMax: 9 },
  { iso: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼', nsnMin: 9, nsnMax: 9 },
  { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾', nsnMin: 9, nsnMax: 10 },
  { iso: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱', nsnMin: 8, nsnMax: 8 },
  { iso: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺', nsnMin: 8, nsnMax: 8 },
  { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', nsnMin: 10, nsnMax: 10 },
  { iso: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦', nsnMin: 9, nsnMax: 9 },
  { iso: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿', nsnMin: 9, nsnMax: 9 },
  { iso: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦', nsnMin: 9, nsnMax: 9 },
  { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', nsnMin: 9, nsnMax: 9 },
  { iso: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿', nsnMin: 8, nsnMax: 10 },
  { iso: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪', nsnMin: 8, nsnMax: 8 },
  { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', nsnMin: 8, nsnMax: 8 },
  { iso: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰', nsnMin: 10, nsnMax: 10 },
  { iso: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', nsnMin: 10, nsnMax: 10 },
  { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', nsnMin: 9, nsnMax: 9 },
  { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', nsnMin: 9, nsnMax: 9 },
  { iso: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦', nsnMin: 8, nsnMax: 8 },
  { iso: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴', nsnMin: 9, nsnMax: 9 },
  { iso: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', nsnMin: 10, nsnMax: 10 },
  { iso: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼', nsnMin: 9, nsnMax: 9 },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', nsnMin: 9, nsnMax: 9 },
  { iso: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳', nsnMin: 9, nsnMax: 9 },
  { iso: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱', nsnMin: 8, nsnMax: 8 },
  { iso: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬', nsnMin: 8, nsnMax: 8 },
  { iso: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴', nsnMin: 7, nsnMax: 9 },
  { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', nsnMin: 9, nsnMax: 9 },
  { iso: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩', nsnMin: 9, nsnMax: 9 },
  { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', nsnMin: 7, nsnMax: 9 },
  { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', nsnMin: 9, nsnMax: 9 },
  { iso: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿', nsnMin: 9, nsnMax: 9 },
  { iso: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', nsnMin: 9, nsnMax: 9 },
  { iso: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬', nsnMin: 8, nsnMax: 8 },
  { iso: 'TT', name: 'Trinidad and Tobago', dial: '+1868', flag: '🇹🇹', nsnMin: 7, nsnMax: 7 },
  { iso: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳', nsnMin: 8, nsnMax: 8 },
  { iso: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷', nsnMin: 10, nsnMax: 10 },
  { iso: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬', nsnMin: 9, nsnMax: 9 },
  { iso: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦', nsnMin: 9, nsnMax: 9 },
  { iso: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳', nsnMin: 9, nsnMax: 10 },
  { iso: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲', nsnMin: 9, nsnMax: 9 },
  { iso: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼', nsnMin: 9, nsnMax: 9 },
];

/** Nigeria is the launch market, so it is the default rather than the US. */
export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso === 'NG') ?? (COUNTRIES[0] as Country);

export function findCountry(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}

export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.dial.includes(q.replace(/^\+?/, '+')) ||
      c.dial.replace('+', '').startsWith(q.replace('+', '')),
  );
}
