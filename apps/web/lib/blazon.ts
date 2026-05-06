import type { CountryFlag } from './countries.js';

/**
 * Pre-written heraldic blazons for known country flags. These follow standard
 * blazon grammar (tinctures capitalized, ordinaries named in their proper terms).
 */
const BLAZONS: Record<string, string> = {
  // Horizontal tricolors
  DE: 'Tierced per fess Sable, Gules, and Or.',
  NL: 'Tierced per fess Gules, Argent, and Azure.',
  RU: 'Tierced per fess Argent, Azure, and Gules.',
  HU: 'Tierced per fess Gules, Argent, and Vert.',
  AT: 'Tierced per fess Gules, Argent, and Gules.',
  EE: 'Tierced per fess Azure, Sable, and Argent.',
  LT: 'Tierced per fess Or, Vert, and Gules.',
  CO: 'Per fess Or and per fess Azure and Gules, the Or being of double width.',
  AM: 'Tierced per fess Gules, Azure, and Or.',
  BG: 'Tierced per fess Argent, Vert, and Gules.',
  EG: 'Tierced per fess Gules, Argent, and Sable; in fess an eagle Or.',
  IR: 'Tierced per fess Vert, Argent, and Gules.',
  IQ: 'Tierced per fess Gules, Argent, and Sable; in fess takbir Vert.',
  YE: 'Tierced per fess Gules, Argent, and Sable.',
  SY: 'Tierced per fess Gules, Argent, and Sable; in fess two mullets Vert.',
  BO: 'Tierced per fess Gules, Or, and Vert.',
  EC: 'Per fess Or and per fess Azure and Gules, the Or being of double width.',
  VE: 'Tierced per fess Or, Azure, and Gules; in fess an arc of eight mullets Argent.',

  // Bicolors and Pan-Slavic vertical tricolors
  UA: 'Per fess Azure and Or.',
  PL: 'Per fess Argent and Gules.',
  ID: 'Per fess Gules and Argent.',
  TH: 'Barry of five Gules, Argent, Azure, Argent, and Gules, the Azure of double width.',
  CR: 'Barry of five Azure, Argent, Gules, Argent, and Azure, the Gules of double width.',

  // Vertical tricolors
  FR: 'Tierced per pale Azure, Argent, and Gules.',
  IT: 'Tierced per pale Vert, Argent, and Gules.',
  BE: 'Tierced per pale Sable, Or, and Gules.',
  IE: 'Tierced per pale Vert, Argent, and Tenné.',
  RO: 'Tierced per pale Azure, Or, and Gules.',
  NG: 'Tierced per pale Vert, Argent, and Vert.',
  PE: 'Tierced per pale Gules, Argent, and Gules.',
  MX: 'Tierced per pale Vert, Argent, and Gules; in pale the eagle and serpent proper.',
  SN: 'Tierced per pale Vert, Or, and Gules; in fess a mullet Vert.',
  ML: 'Tierced per pale Vert, Or, and Gules.',
  GN: 'Tierced per pale Gules, Or, and Vert.',
  CI: 'Tierced per pale Tenné, Argent, and Vert.',
  CM: 'Tierced per pale Vert, Gules, and Or; in fess a mullet Or.',
  MN: 'Tierced per pale Gules, Azure, and Gules; at the hoist the soyombo Or.',

  // Nordic crosses
  SE: 'Azure, a Nordic cross Or.',
  FI: 'Argent, a Nordic cross Azure.',
  DK: 'Gules, a Nordic cross Argent.',
  NO: 'Gules, a Nordic cross Azure fimbriated Argent.',
  IS: 'Azure, a Nordic cross Gules fimbriated Argent.',

  // Centered cross / saltire
  CH: 'Gules, a couped cross Argent.',
  GR: 'Barry of nine Azure and Argent; in canton Azure a Greek cross Argent.',
  JM: 'Vert, a saltire Or; the dexter and sinister panels Sable.',

  // Triangle hoist / chevron / pall
  CZ: 'Per fess Argent and Gules, a pile Azure issuant from the hoist.',
  CU: 'Barry of five Azure and Argent; a pile Gules issuant from the hoist charged with a mullet Argent.',
  SD: 'Tierced per fess Gules, Argent, and Sable; a pile Vert issuant from the hoist.',
  PH: 'Per fess Azure and Gules; a pile Argent issuant from the hoist charged with a sun and three mullets Or.',
  ZA: 'A pall Vert fimbriated Or and Argent; the dexter chief Gules, the dexter base Azure, the sinister Or and Sable, charged in heraldic memory of the Rainbow Nation.',

  // Disc / charge at center
  JP: 'Argent, a roundel Gules.',
  BD: 'Vert, a roundel Gules.',
  PW: 'Azure, a roundel Or.',
  KR: 'Argent, a taeguk Gules and Azure surrounded by four trigrams Sable, called the Taegukgi.',
  LA: 'Tierced per fess Gules, Azure, and Gules; over all in fess a roundel Argent.',

  // Crescent and star
  TR: 'Gules, a decrescent and a mullet Argent.',
  TN: 'Gules, a roundel Argent charged with a decrescent and a mullet Gules.',
  DZ: 'Per pale Vert and Argent; over all a decrescent and a mullet Gules.',
  PK: 'Vert, a decrescent and a mullet of five Argent; a pale Argent at the hoist.',
  SG: 'Per fess Gules and Argent; in chief a decrescent and five mullets Argent.',
  MV: 'Gules, a panel Vert charged with a decrescent Argent.',

  // Charges, complex
  AE: 'Tierced per fess Vert, Argent, and Sable; a pale Gules at the hoist.',
  JO: 'Tierced per fess Sable, Argent, and Vert; a pile Gules issuant from the hoist charged with a mullet of seven Argent.',
  LB: 'Per fess Gules, Argent, and Gules, the Argent of double width; in fess a cedar Vert.',
  IL: 'Argent, two pales fess-wise Azure between which the shield of David Azure.',
  CL: 'Per fess Argent and Gules; a canton Azure charged with a mullet Argent.',
  CN: 'Gules, in canton one mullet of five greater and four mullets of five lesser Or.',
  VN: 'Gules, a mullet Or.',
  SO: 'Azure, a mullet Argent.',
  MA: 'Gules, a mullet of five Vert.',
  ET: 'Tierced per fess Vert, Or, and Gules; over all in fess a roundel Azure charged with a sun mullet Or.',
  GH: 'Tierced per fess Gules, Or, and Vert; in fess a mullet of five Sable.',
  IN: 'Tierced per fess Tenné, Argent, and Vert; over all in fess a chakra Azure of twenty-four spokes.',
  AR: 'Tierced per fess Celeste, Argent, and Celeste; in fess a sol de mayo Or.',
  CA: 'Tierced per pale Gules, Argent, and Gules; in pale a maple leaf Gules.',
  ES: 'Per fess Or, Gules of double width, and Or; in dexter chief the Royal Arms.',
  PT: 'Per pale Vert and Gules; in fess an armillary sphere Or.',
  GB: 'Azure, the cross of Saint George Gules fimbriated Argent surmounted on the saltire of Saint Andrew Argent and the saltire of Saint Patrick Gules.',
  AU: 'Azure, a canton Argent charged with the Union; in fess a mullet of seven Argent and the Southern Cross of five mullets Argent.',
  NZ: 'Azure, a canton Argent charged with the Union; in fess the Southern Cross of four mullets Gules fimbriated Argent.',
  US: 'Barry of thirteen Gules and Argent; in canton Azure strewn with mullets Argent in rows.',
  BR: 'Vert, a lozenge Or; thereon a roundel Azure charged with a bend Argent inscribed and strewn with mullets Argent.',
  MY: 'Barry of fourteen Gules and Argent; in canton Azure charged with a decrescent and a mullet Or of fourteen points.',
  SA: 'Vert, the shahada and a sword Argent.',
  KE: 'Tierced per fess Sable, Gules, and Vert fimbriated Argent; in fess a Maasai shield and crossed spears proper.',
  SK: 'Tierced per fess Argent, Azure, and Gules; in dexter chief the patriarchal cross of Slovakia upon a shield Gules.',
  HR: 'Tierced per fess Gules, Argent, and Azure; in fess the chequered shield of Croatia.',
  SI: 'Tierced per fess Argent, Azure, and Gules; in dexter chief the arms of Slovenia.',
  GL: 'Per fess Argent and Gules; over all a roundel counterchanged.',
};

/** Generate a formal heraldic blazon for a matched country flag. */
export function generateBlazonForCountry(country: CountryFlag): string {
  return (
    BLAZONS[country.code] ??
    `The flag of ${country.name}, bearing its characteristic colors and symbols.`
  );
}
