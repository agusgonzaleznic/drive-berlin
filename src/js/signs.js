// ============ German traffic sign SVG library (hand-drawn, simplified) ============
// Each sign is a small inline SVG. IDs are referenced by lessons and questions.

const W = (inner, vb = '0 0 100 100') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// Shape helpers
const warnTriangle = inner => W(
  `<path d="M50 6 L96 88 L4 88 Z" fill="#d31f26"/><path d="M50 17 L87.5 83 L12.5 83 Z" fill="#fff"/>${inner}`);
const forbidCircle = inner => W(
  `<circle cx="50" cy="50" r="47" fill="#d31f26"/><circle cx="50" cy="50" r="37" fill="#fff"/>${inner}`);
const blueCircle = inner => W(
  `<circle cx="50" cy="50" r="47" fill="#1660a8"/><circle cx="50" cy="50" r="43" fill="none" stroke="#fff" stroke-width="3"/>${inner}`);
const blueSquare = inner => W(
  `<rect x="4" y="4" width="92" height="92" rx="8" fill="#1660a8"/><rect x="8" y="8" width="84" height="84" rx="6" fill="none" stroke="#fff" stroke-width="3"/>${inner}`);
const num = (n, size = 34, y = 62, color = '#111') =>
  `<text x="50" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${size}" fill="${color}">${n}</text>`;
const car = (x, y, color, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="6" width="26" height="12" rx="4" fill="${color}"/><rect x="5" y="0" width="15" height="9" rx="3" fill="${color}"/></g>`;
const person = (x, y, color = '#111', s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}"><circle cx="6" cy="4" r="4"/><path d="M6 8 L2 20 L5 20 L6 14 L7 20 L10 20 Z"/><path d="M6 9 L0 15 M6 9 L12 14" stroke="${color}" stroke-width="2.4"/></g>`;
const bike = (x, y, color = '#111', s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="3"><circle cx="8" cy="20" r="7"/><circle cx="32" cy="20" r="7"/><path d="M8 20 L16 8 L26 8 L32 20 M16 8 L20 20 L8 20 M20 4 L26 8"/></g>`;

export const SIGNS = {
  stop: { name: 'Stop, give way (Halt! Vorfahrt gewähren)', svg: W(
    `<path d="M30 3 H70 L97 30 V70 L70 97 H30 L3 70 V30 Z" fill="#d31f26" stroke="#fff" stroke-width="5"/>
     <text x="50" y="61" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="26" fill="#fff">STOP</text>`) },
  yield: { name: 'Give way (Vorfahrt gewähren)', svg: W(
    `<path d="M4 12 H96 L50 94 Z" fill="#d31f26"/><path d="M14 17 H86 L50 82 Z" fill="#fff"/>`) },
  priority_road: { name: 'Priority road (Vorfahrtstraße)', svg: W(
    `<rect x="14" y="14" width="72" height="72" rx="10" transform="rotate(45 50 50)" fill="#f6c800" stroke="#fff" stroke-width="6"/>
     <rect x="30" y="30" width="40" height="40" rx="5" transform="rotate(45 50 50)" fill="#fff" stroke="#b98b00" stroke-width="2"/>`) },
  end_priority_road: { name: 'End of priority road (Ende der Vorfahrtstraße)', svg: W(
    `<rect x="14" y="14" width="72" height="72" rx="10" transform="rotate(45 50 50)" fill="#f6c800" stroke="#fff" stroke-width="6"/>
     <rect x="30" y="30" width="40" height="40" rx="5" transform="rotate(45 50 50)" fill="#fff" stroke="#b98b00" stroke-width="2"/>
     <g stroke="#555" stroke-width="7"><line x1="22" y1="78" x2="78" y2="22"/><line x1="30" y1="86" x2="86" y2="30"/><line x1="14" y1="70" x2="70" y2="14"/></g>`) },
  priority_next: { name: 'Priority at next junction (Vorfahrt)', svg: warnTriangle(
    `<g stroke="#111" stroke-linecap="round"><line x1="50" y1="38" x2="50" y2="80" stroke-width="9"/><line x1="32" y1="58" x2="68" y2="58" stroke-width="4"/></g>`) },
  danger: { name: 'General danger (Gefahrstelle)', svg: warnTriangle(
    `<rect x="46" y="34" width="8" height="28" rx="3" fill="#111"/><circle cx="50" cy="74" r="5" fill="#111"/>`) },
  children: { name: 'Watch for children (Kinder)', svg: warnTriangle(
    `${person(34, 40, '#111', 1.5)}${person(52, 44, '#111', 1.2)}`) },
  bicycles_crossing: { name: 'Cyclists crossing (Radverkehr)', svg: warnTriangle(bike(30, 42, '#111', 1)) },
  railroad: { name: 'Level crossing: St. Andrew\'s cross (Andreaskreuz)', svg: W(
    `<g transform="rotate(0 50 50)"><path d="M8 26 L92 74 M92 26 L8 74" stroke="#fff" stroke-width="22"/><path d="M8 26 L92 74 M92 26 L8 74" stroke="#d31f26" stroke-width="18"/><path d="M14 29 L86 71 M86 29 L14 71" stroke="#fff" stroke-width="10"/></g>`) },
  speed_30: { name: 'Speed limit 30 km/h', svg: forbidCircle(num(30, 36, 63)) },
  speed_50: { name: 'Speed limit 50 km/h', svg: forbidCircle(num(50, 36, 63)) },
  speed_100: { name: 'Speed limit 100 km/h', svg: forbidCircle(num(100, 30, 61)) },
  end_limits: { name: 'End of all restrictions (Ende sämtlicher Verbote)', svg: W(
    `<circle cx="50" cy="50" r="47" fill="#fff" stroke="#bbb" stroke-width="3"/>
     <g stroke="#777" stroke-width="6"><line x1="20" y1="80" x2="80" y2="20"/><line x1="30" y1="90" x2="90" y2="30"/><line x1="10" y1="70" x2="70" y2="10"/></g>`) },
  zone30: { name: '30 km/h zone (Tempo 30-Zone)', svg: W(
    `<rect x="4" y="4" width="92" height="92" rx="8" fill="#fff" stroke="#999" stroke-width="3"/>
     <text x="50" y="30" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="18" fill="#111">ZONE</text>
     <circle cx="50" cy="62" r="30" fill="#d31f26"/><circle cx="50" cy="62" r="23" fill="#fff"/>${num(30, 24, 71)}`) },
  no_entry: { name: 'No entry (Verbot der Einfahrt)', svg: W(
    `<circle cx="50" cy="50" r="47" fill="#d31f26"/><rect x="16" y="42" width="68" height="16" rx="4" fill="#fff"/>`) },
  no_vehicles: { name: 'Closed to all vehicles (Verbot für Fahrzeuge aller Art)', svg: forbidCircle('') },
  one_way: { name: 'One-way street (Einbahnstraße)', svg: W(
    `<rect x="2" y="30" width="96" height="40" rx="6" fill="#1660a8"/>
     <path d="M18 50 H68 M56 38 L74 50 L56 62" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, '0 0 100 100') },
  no_overtaking: { name: 'No overtaking (Überholverbot)', svg: forbidCircle(
    `${car(18, 38, '#d31f26')}${car(52, 38, '#111')}`) },
  end_no_overtaking: { name: 'End of no-overtaking zone', svg: W(
    `<circle cx="50" cy="50" r="47" fill="#fff" stroke="#bbb" stroke-width="3"/>${car(18, 38, '#888')}${car(52, 38, '#888')}
     <g stroke="#777" stroke-width="6"><line x1="20" y1="80" x2="80" y2="20"/><line x1="30" y1="90" x2="90" y2="30"/></g>`) },
  autobahn: { name: 'Motorway (Autobahn)', svg: blueSquare(
    `<g fill="#fff"><rect x="30" y="24" width="10" height="52" transform="skewX(-8)"/><rect x="66" y="24" width="10" height="52" transform="skewX(8)"/><rect x="18" y="40" width="64" height="9" rx="2"/></g>`) },
  end_autobahn: { name: 'End of motorway (Ende der Autobahn)', svg: blueSquare(
    `<g fill="#fff" opacity=".9"><rect x="30" y="24" width="10" height="52" transform="skewX(-8)"/><rect x="66" y="24" width="10" height="52" transform="skewX(8)"/><rect x="18" y="40" width="64" height="9" rx="2"/></g>
     <line x1="16" y1="84" x2="84" y2="16" stroke="#d31f26" stroke-width="9"/>`) },
  roundabout: { name: 'Roundabout (Kreisverkehr)', svg: blueCircle(
    `<g fill="none" stroke="#fff" stroke-width="8"><circle cx="50" cy="50" r="18"/></g>
     <path d="M50 20 L60 30 L46 34 Z" fill="#fff" transform="rotate(20 50 50)"/>
     <path d="M50 20 L60 30 L46 34 Z" fill="#fff" transform="rotate(140 50 50)"/>
     <path d="M50 20 L60 30 L46 34 Z" fill="#fff" transform="rotate(260 50 50)"/>`) },
  bike_path: { name: 'Mandatory cycle path (Radweg)', svg: blueCircle(bike(29, 34, '#fff', 1.05)) },
  pedestrian_path: { name: 'Pedestrian path (Gehweg)', svg: blueCircle(`${person(36, 28, '#fff', 2)}`) },
  pedestrian_crossing: { name: 'Pedestrian crossing (Fußgängerüberweg)', svg: blueSquare(
    `<path d="M14 86 L50 22 L86 86 Z" fill="#fff"/>
     <g transform="translate(38 40)" fill="#111"><circle cx="8" cy="5" r="5"/><path d="M8 11 L1 32 L6 32 L8 22 L12 32 L17 32 L10 11 Z"/></g>
     <g stroke="#111" stroke-width="3">${[0, 1, 2, 3].map(i => `<line x1="${26 + i * 14}" y1="86" x2="${32 + i * 14}" y2="74"/>`).join('')}</g>`) },
  bus_lane: { name: 'Bus lane (Bussonderfahrstreifen)', svg: blueCircle(
    `<g fill="#fff"><rect x="22" y="34" width="56" height="26" rx="6"/><circle cx="34" cy="66" r="6"/><circle cx="66" cy="66" r="6"/><rect x="26" y="38" width="12" height="10" fill="#1660a8"/><rect x="42" y="38" width="12" height="10" fill="#1660a8"/><rect x="58" y="38" width="12" height="10" fill="#1660a8"/></g>`) },
  no_parking: { name: 'No parking (Eingeschränktes Haltverbot)', svg: W(
    `<circle cx="50" cy="50" r="47" fill="#1660a8" stroke="#d31f26" stroke-width="7"/>
     <line x1="18" y1="82" x2="82" y2="18" stroke="#d31f26" stroke-width="9"/>`) },
  no_stopping: { name: 'No stopping (Absolutes Haltverbot)', svg: W(
    `<circle cx="50" cy="50" r="47" fill="#1660a8" stroke="#d31f26" stroke-width="7"/>
     <g stroke="#d31f26" stroke-width="9"><line x1="18" y1="82" x2="82" y2="18"/><line x1="18" y1="18" x2="82" y2="82"/></g>`) },
  parking: { name: 'Parking (Parken)', svg: blueSquare(
    `<text x="50" y="72" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="60" fill="#fff">P</text>`) },
  traffic_calmed: { name: 'Traffic-calmed area (Verkehrsberuhigter Bereich)', svg: blueSquare(
    `<path d="M20 46 L34 32 L48 46 Z" fill="#fff"/><rect x="25" y="44" width="18" height="14" fill="#fff"/>
     ${person(56, 30, '#fff', 1.4)}<circle cx="72" cy="62" r="5" fill="#fff"/>${car(18, 66, '#fff', 0.9)}`) },
  umweltzone: { name: 'Low-emission zone (Umweltzone)', svg: W(
    `<rect x="4" y="4" width="92" height="92" rx="8" fill="#fff" stroke="#999" stroke-width="3"/>
     <text x="50" y="26" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="15" fill="#111">UMWELT</text>
     <circle cx="50" cy="60" r="28" fill="#d31f26"/><circle cx="50" cy="60" r="21" fill="#fff"/>
     <text x="50" y="66" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="15" fill="#111">ZONE</text>`) },
  town_entry: { name: 'Town entry, where 50 km/h begins (Ortstafel)', svg: W(

    `<rect x="4" y="22" width="92" height="56" rx="6" fill="#f6c800" stroke="#111" stroke-width="3"/>
     <text x="50" y="57" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#111">Berlin</text>`) },
  town_exit: { name: 'Town exit (Ortstafel Rückseite)', svg: W(
    `<rect x="4" y="22" width="92" height="56" rx="6" fill="#f6c800" stroke="#111" stroke-width="3"/>
     <text x="50" y="57" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="18" fill="#888">Berlin</text>
     <line x1="8" y1="74" x2="92" y2="26" stroke="#d31f26" stroke-width="7"/>`) },
  dead_end: { name: 'Dead end (Sackgasse)', svg: blueSquare(
    `<g stroke="#fff" stroke-width="9"><line x1="50" y1="84" x2="50" y2="34"/></g><rect x="26" y="24" width="48" height="10" fill="#d31f26"/>`) },
  fahrradstrasse: { name: 'Bicycle street (Fahrradstraße)', svg: blueSquare(
    `${bike(28, 26, '#fff', 1)}<text x="50" y="84" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="13" fill="#fff">Fahrradstraße</text>`) },
  kraftfahrstrasse: { name: 'Motor road (Kraftfahrstraße)', svg: blueSquare(car(30, 36, '#fff', 1.6)) },
};

export function signSvg(id) {
  return SIGNS[id]?.svg || '';
}

export function signFigure(id, caption) {
  const s = SIGNS[id];
  if (!s) return '';
  const cap = caption || s.name;
  return `<figure class="sign-figure">${s.svg}<figcaption>${cap}</figcaption></figure>`;
}
