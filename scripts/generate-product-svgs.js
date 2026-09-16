const fs = require('fs');
const path = require('path');

const products = [
  {
    id: 'prod-h10pro',
    title: 'FPC ECO SERIES H10 PRO',
    badge: '4 FLUXOS • SOLAR • TOP',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-h10" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c130e"/>
      <stop offset="100%" stop-color="#142117"/>
    </linearGradient>
    <linearGradient id="body-steel" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e2920"/>
      <stop offset="30%" stop-color="#324637"/>
      <stop offset="70%" stop-color="#243428"/>
      <stop offset="100%" stop-color="#1a251c"/>
    </linearGradient>
    <linearGradient id="solar-pv" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#102a43"/>
      <stop offset="50%" stop-color="#243b53"/>
      <stop offset="100%" stop-color="#0b1b2b"/>
    </linearGradient>
    <linearGradient id="neon-glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#53ee81"/>
      <stop offset="100%" stop-color="#2ecc71"/>
    </linearGradient>
    <filter id="glow-h10" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="240" height="240" rx="20" fill="url(#bg-grad-h10)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Subtle grid pattern -->
  <path d="M20 60h200M20 120h200M20 180h200M60 20v200M120 20v200M180 20v200" stroke="#53ee81" stroke-opacity="0.04" stroke-width="1"/>

  <!-- Solar Roof Canopy -->
  <polygon points="34,44 206,44 196,28 44,28" fill="url(#solar-pv)" stroke="#53ee81" stroke-opacity="0.4" stroke-width="1.2"/>
  <!-- Solar PV cells -->
  <line x1="68" y1="28" x2="62" y2="44" stroke="#486581" stroke-width="1"/>
  <line x1="94" y1="28" x2="90" y2="44" stroke="#486581" stroke-width="1"/>
  <line x1="120" y1="28" x2="120" y2="44" stroke="#486581" stroke-width="1"/>
  <line x1="146" y1="28" x2="150" y2="44" stroke="#486581" stroke-width="1"/>
  <line x1="172" y1="28" x2="178" y2="44" stroke="#486581" stroke-width="1"/>
  <line x1="39" y1="36" x2="201" y2="36" stroke="#486581" stroke-width="0.8"/>

  <!-- Station Upper Casing -->
  <rect x="42" y="44" width="156" height="150" rx="8" fill="url(#body-steel)" stroke="#4a6350" stroke-width="1.5"/>

  <!-- Top Smart IoT Display Screen -->
  <rect x="52" y="52" width="136" height="22" rx="4" fill="#09100a" stroke="#53ee81" stroke-opacity="0.6" stroke-width="1"/>
  <circle cx="62" cy="63" r="3" fill="#53ee81" filter="url(#glow-h10)"/>
  <text x="72" y="66" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.08em">FPC H10 PRO • 100% SOLAR</text>
  <rect x="170" y="59" width="12" height="8" rx="1.5" fill="none" stroke="#53ee81" stroke-width="0.9"/>
  <rect x="172" y="61" width="6" height="4" fill="#53ee81"/>

  <!-- 4 Smart Recycling Compartments -->
  <!-- Compartment 1: Papel (Blue) -->
  <g transform="translate(50, 82)">
    <rect width="32" height="98" rx="4" fill="#152018" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="1.2"/>
    <rect x="4" y="6" width="24" height="6" rx="2" fill="#38bdf8" fill-opacity="0.85"/>
    <circle cx="16" cy="22" r="3.5" fill="#38bdf8" fill-opacity="0.9"/>
    <!-- Sorting icon lines -->
    <rect x="7" y="36" width="18" height="42" rx="2" fill="#0d1610" stroke="#2a4533" stroke-width="0.8"/>
    <line x1="10" y1="44" x2="22" y2="44" stroke="#38bdf8" stroke-width="1.2"/>
    <line x1="10" y1="52" x2="20" y2="52" stroke="#38bdf8" stroke-width="1.2"/>
    <line x1="10" y1="60" x2="18" y2="60" stroke="#38bdf8" stroke-width="1.2"/>
    <!-- Fill level gauge -->
    <rect x="7" y="86" width="18" height="3" rx="1.5" fill="#38bdf8" fill-opacity="0.4"/>
    <rect x="7" y="86" width="11" height="3" rx="1.5" fill="#38bdf8"/>
  </g>

  <!-- Compartment 2: Plástico (Yellow) -->
  <g transform="translate(86, 82)">
    <rect width="32" height="98" rx="4" fill="#152018" stroke="#f59e0b" stroke-opacity="0.7" stroke-width="1.2"/>
    <rect x="4" y="6" width="24" height="6" rx="2" fill="#f59e0b" fill-opacity="0.85"/>
    <circle cx="16" cy="22" r="3.5" fill="#f59e0b" fill-opacity="0.9"/>
    <rect x="7" y="36" width="18" height="42" rx="2" fill="#0d1610" stroke="#2a4533" stroke-width="0.8"/>
    <!-- Bottle silhouette -->
    <path d="M14 42h4v3h2l1 12h-8l1-12h2z" fill="#f59e0b" fill-opacity="0.7"/>
    <!-- Fill gauge -->
    <rect x="7" y="86" width="18" height="3" rx="1.5" fill="#f59e0b" fill-opacity="0.4"/>
    <rect x="7" y="86" width="14" height="3" rx="1.5" fill="#f59e0b"/>
  </g>

  <!-- Compartment 3: Vidro (Green) -->
  <g transform="translate(122, 82)">
    <rect width="32" height="98" rx="4" fill="#152018" stroke="#10b981" stroke-opacity="0.7" stroke-width="1.2"/>
    <rect x="4" y="6" width="24" height="6" rx="2" fill="#10b981" fill-opacity="0.85"/>
    <circle cx="16" cy="22" r="3.5" fill="#10b981" fill-opacity="0.9"/>
    <rect x="7" y="36" width="18" height="42" rx="2" fill="#0d1610" stroke="#2a4533" stroke-width="0.8"/>
    <!-- Glass silhouette -->
    <path d="M12 43h8l-2 11h-4z M15 54v4 M12 58h6" stroke="#10b981" stroke-width="1.2" fill="none"/>
    <!-- Fill gauge -->
    <rect x="7" y="86" width="18" height="3" rx="1.5" fill="#10b981" fill-opacity="0.4"/>
    <rect x="7" y="86" width="7" height="3" rx="1.5" fill="#10b981"/>
  </g>

  <!-- Compartment 4: Orgânico (Red/Orange) -->
  <g transform="translate(158, 82)">
    <rect width="32" height="98" rx="4" fill="#152018" stroke="#ef4444" stroke-opacity="0.7" stroke-width="1.2"/>
    <rect x="4" y="6" width="24" height="6" rx="2" fill="#ef4444" fill-opacity="0.85"/>
    <circle cx="16" cy="22" r="3.5" fill="#ef4444" fill-opacity="0.9"/>
    <rect x="7" y="36" width="18" height="42" rx="2" fill="#0d1610" stroke="#2a4533" stroke-width="0.8"/>
    <!-- Leaf / organic icon -->
    <path d="M16 43c3 2 4 6 2 9-2 3-6 4-6 4s1-4 2-6c2-3 2-7 2-7z" fill="#ef4444" fill-opacity="0.7"/>
    <!-- Fill gauge -->
    <rect x="7" y="86" width="18" height="3" rx="1.5" fill="#ef4444" fill-opacity="0.4"/>
    <rect x="7" y="86" width="16" height="3" rx="1.5" fill="#ef4444"/>
  </g>

  <!-- Ground mounting plinth / Base -->
  <polygon points="36,204 204,204 212,216 28,216" fill="#131b15" stroke="#36493b" stroke-width="1.2"/>
  <rect x="32" y="214" width="176" height="6" rx="2" fill="#0b110c"/>
  <circle cx="48" cy="210" r="2" fill="#53ee81"/>
  <circle cx="192" cy="210" r="2" fill="#53ee81"/>

  <!-- Subtle glow edge bar -->
  <line x1="46" y1="194" x2="194" y2="194" stroke="#53ee81" stroke-width="1.5" filter="url(#glow-h10)"/>

  <!-- Top Badge Label -->
  <g transform="translate(142, 14)">
    <rect width="84" height="18" rx="9" fill="#007A33" stroke="#53ee81" stroke-width="1"/>
    <text x="42" y="12" fill="#ffffff" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">FLAGSHIP MUNICIPAL</text>
  </g>
</svg>`
  },

  {
    id: 'prod-epson',
    title: 'FPC ECO SERIES EPSON',
    badge: 'ALTA COMPACTAÇÃO • IOT',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-epson" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c120e"/>
      <stop offset="100%" stop-color="#151e18"/>
    </linearGradient>
    <linearGradient id="epson-body" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#232a24"/>
      <stop offset="50%" stop-color="#38433a"/>
      <stop offset="100%" stop-color="#202721"/>
    </linearGradient>
    <linearGradient id="canopy-epson" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#007A33"/>
      <stop offset="100%" stop-color="#0e3d1d"/>
    </linearGradient>
    <filter id="glow-epson" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-epson)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- High-capacity Compactor Canopy -->
  <path d="M46 36 L194 36 L202 52 L38 52 Z" fill="url(#canopy-epson)" stroke="#53ee81" stroke-width="1.2"/>
  <line x1="50" y1="44" x2="190" y2="44" stroke="#53ee81" stroke-width="1" stroke-dasharray="4 3"/>

  <!-- Main Chassis -->
  <rect x="46" y="52" width="148" height="142" rx="6" fill="url(#epson-body)" stroke="#455447" stroke-width="1.5"/>

  <!-- Digital Telemetry Screen -->
  <rect x="62" y="60" width="116" height="20" rx="3" fill="#0a120b" stroke="#53ee81" stroke-opacity="0.5" stroke-width="1"/>
  <circle cx="72" cy="70" r="2.8" fill="#53ee81" filter="url(#glow-epson)"/>
  <text x="82" y="73" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="8" font-weight="700">FPC EPSON • COMPACTAÇÃO ATIVA</text>

  <!-- Heavy Duty Double Compactor Doors -->
  <!-- Door Left -->
  <g transform="translate(56, 88)">
    <rect width="60" height="96" rx="4" fill="#141a15" stroke="#007A33" stroke-width="1.2"/>
    <!-- Pull handle -->
    <rect x="12" y="10" width="36" height="6" rx="3" fill="#53ee81" fill-opacity="0.7"/>
    <!-- Compactor hydraulic ram indicator -->
    <rect x="10" y="24" width="40" height="42" rx="2" fill="#0d140e" stroke="#2d3b2f" stroke-width="0.8"/>
    <path d="M22 34l8 8 8-8M22 44l8 8 8-8" stroke="#53ee81" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="30" y="60" fill="#a4b0a0" font-family="'Lexend', sans-serif" font-size="6.5" text-anchor="middle">5:1 RATIO</text>
    <!-- Status LED -->
    <circle cx="30" cy="80" r="4" fill="#53ee81" filter="url(#glow-epson)"/>
  </g>

  <!-- Door Right -->
  <g transform="translate(124, 88)">
    <rect width="60" height="96" rx="4" fill="#141a15" stroke="#007A33" stroke-width="1.2"/>
    <rect x="12" y="10" width="36" height="6" rx="3" fill="#53ee81" fill-opacity="0.7"/>
    <rect x="10" y="24" width="40" height="42" rx="2" fill="#0d140e" stroke="#2d3b2f" stroke-width="0.8"/>
    <path d="M22 34l8 8 8-8M22 44l8 8 8-8" stroke="#53ee81" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="30" y="60" fill="#a4b0a0" font-family="'Lexend', sans-serif" font-size="6.5" text-anchor="middle">RECOLHA AUTO</text>
    <circle cx="30" cy="80" r="4" fill="#53ee81" filter="url(#glow-epson)"/>
  </g>

  <!-- Base plinth -->
  <rect x="38" y="194" width="164" height="14" rx="3" fill="#101511" stroke="#324135" stroke-width="1.2"/>
  <line x1="46" y1="201" x2="194" y2="201" stroke="#53ee81" stroke-width="1.2" stroke-opacity="0.7"/>

  <!-- Top Badge -->
  <g transform="translate(138, 14)">
    <rect width="88" height="18" rx="9" fill="#152b1b" stroke="#53ee81" stroke-width="1"/>
    <text x="44" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">CAMPUS & ESTÁDIOS</text>
  </g>
</svg>`
  },

  {
    id: 'prod-longua',
    title: 'FPC ECO SERIES LONGUA',
    badge: 'RESIDENCIAL • RFID',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-longua" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c130f"/>
      <stop offset="100%" stop-color="#142217"/>
    </linearGradient>
    <linearGradient id="longua-cyl" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#223025"/>
      <stop offset="25%" stop-color="#3d5241"/>
      <stop offset="60%" stop-color="#2a392c"/>
      <stop offset="100%" stop-color="#1b251d"/>
    </linearGradient>
    <linearGradient id="longua-glow-ring" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#53ee81"/>
      <stop offset="100%" stop-color="#007A33"/>
    </linearGradient>
    <filter id="glow-longua" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-longua)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Cylindrical Modern Residential Column -->
  <!-- Top Lid Ring -->
  <ellipse cx="120" cy="50" rx="58" ry="16" fill="url(#longua-glow-ring)" stroke="#53ee81" stroke-width="1.5"/>
  <ellipse cx="120" cy="48" rx="46" ry="11" fill="#0d140e" stroke="#53ee81" stroke-opacity="0.6" stroke-width="1"/>

  <!-- Cylindrical Body -->
  <path d="M62 50 L62 188 C62 202, 178 202, 178 188 L178 50 Z" fill="url(#longua-cyl)" stroke="#435545" stroke-width="1.5"/>

  <!-- Aperture Door with Anti-Odor Seal -->
  <rect x="78" y="70" width="84" height="34" rx="10" fill="#0f1711" stroke="#53ee81" stroke-width="1.2"/>
  <line x1="88" y1="87" x2="152" y2="87" stroke="#53ee81" stroke-width="2" stroke-linecap="round" filter="url(#glow-longua)"/>
  <text x="120" y="80" fill="#a4b0a0" font-family="'Lexend', sans-serif" font-size="7" font-weight="600" text-anchor="middle">ANTI-ODOR SEAL</text>

  <!-- Citizen RFID Access Tap Unit -->
  <g transform="translate(88, 116)">
    <rect width="64" height="34" rx="6" fill="#121b14" stroke="#53ee81" stroke-opacity="0.8" stroke-width="1"/>
    <!-- RFID waves icon -->
    <path d="M22 17a6 6 0 0 1 0 10M17 13a11 11 0 0 1 0 18M27 20a2 2 0 0 1 0 4" stroke="#53ee81" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="44" y="24" fill="#ffffff" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700">RFID</text>
    <text x="44" y="31" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="6">CIDADÃO</text>
  </g>

  <!-- Fill Level Laser Indicator Bar -->
  <rect x="88" y="160" width="64" height="8" rx="4" fill="#0c130e" stroke="#2f4133" stroke-width="1"/>
  <rect x="90" y="162" width="38" height="4" rx="2" fill="#53ee81" filter="url(#glow-longua)"/>

  <!-- Bottom pedestal -->
  <ellipse cx="120" cy="192" rx="64" ry="14" fill="#131c15" stroke="#53ee81" stroke-opacity="0.5" stroke-width="1.2"/>
  <ellipse cx="120" cy="196" rx="72" ry="12" fill="#0b100c"/>

  <!-- Top Badge -->
  <g transform="translate(132, 14)">
    <rect width="94" height="18" rx="9" fill="#112b19" stroke="#53ee81" stroke-width="1"/>
    <text x="47" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">ZONAS RESIDENCIAIS</text>
  </g>
</svg>`
  },

  {
    id: 'prod-ngolo',
    title: 'FPC ECO NGOLO',
    badge: 'ENSINO & B2B',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-ngolo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1510"/>
      <stop offset="100%" stop-color="#142117"/>
    </linearGradient>
    <linearGradient id="ngolo-body" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#243026"/>
      <stop offset="50%" stop-color="#354638"/>
      <stop offset="100%" stop-color="#202b22"/>
    </linearGradient>
    <filter id="glow-ngolo" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-ngolo)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Ngolo Dual Stream Station Body -->
  <rect x="52" y="46" width="136" height="150" rx="10" fill="url(#ngolo-body)" stroke="#455848" stroke-width="1.5"/>

  <!-- Curved Top Visor -->
  <path d="M52 56 Q120 40 188 56 L188 66 L52 66 Z" fill="#007A33" stroke="#53ee81" stroke-width="1"/>
  <circle cx="120" cy="56" r="3" fill="#53ee81" filter="url(#glow-ngolo)"/>

  <!-- Left Compartment: Recicláveis -->
  <g transform="translate(62, 74)">
    <rect width="52" height="108" rx="6" fill="#111812" stroke="#38bdf8" stroke-width="1.2"/>
    <rect x="8" y="10" width="36" height="8" rx="3" fill="#38bdf8" fill-opacity="0.8"/>
    <!-- Recyclable icons -->
    <path d="M26 30l-8 14h16z" stroke="#38bdf8" stroke-width="1.2" fill="none"/>
    <text x="26" y="58" fill="#ffffff" font-family="'Lexend', sans-serif" font-size="7" font-weight="700" text-anchor="middle">RECICLÁVEIS</text>
    <text x="26" y="68" fill="#38bdf8" font-family="'Lexend', sans-serif" font-size="6" text-anchor="middle">PAPEL &amp; PET</text>
    <!-- Sensor bar -->
    <rect x="8" y="92" width="36" height="4" rx="2" fill="#38bdf8" fill-opacity="0.6"/>
  </g>

  <!-- Right Compartment: Indiferenciados -->
  <g transform="translate(126, 74)">
    <rect width="52" height="108" rx="6" fill="#111812" stroke="#53ee81" stroke-width="1.2"/>
    <rect x="8" y="10" width="36" height="8" rx="3" fill="#53ee81" fill-opacity="0.8"/>
    <!-- Waste icon -->
    <circle cx="26" cy="36" r="7" stroke="#53ee81" stroke-width="1.2" fill="none"/>
    <text x="26" y="58" fill="#ffffff" font-family="'Lexend', sans-serif" font-size="7" font-weight="700" text-anchor="middle">GERAL</text>
    <text x="26" y="68" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="6" text-anchor="middle">ORGÂNICO</text>
    <!-- Sensor bar -->
    <rect x="8" y="92" width="36" height="4" rx="2" fill="#53ee81" fill-opacity="0.6"/>
  </g>

  <!-- Heavy Base Frame -->
  <rect x="44" y="196" width="152" height="12" rx="3" fill="#0f1510" stroke="#344336" stroke-width="1.2"/>
  <circle cx="58" cy="202" r="2.5" fill="#53ee81"/>
  <circle cx="182" cy="202" r="2.5" fill="#53ee81"/>

  <!-- Top Badge -->
  <g transform="translate(136, 14)">
    <rect width="90" height="18" rx="9" fill="#132719" stroke="#53ee81" stroke-width="1"/>
    <text x="45" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">ESCOLAS &amp; CAMPUS</text>
  </g>
</svg>`
  },

  {
    id: 'prod-aventor',
    title: 'FPC ECO AVENTOR',
    badge: 'URBANO CONECTADO',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-aventor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d140f"/>
      <stop offset="100%" stop-color="#142117"/>
    </linearGradient>
    <linearGradient id="aventor-pole" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1c251e"/>
      <stop offset="50%" stop-color="#344637"/>
      <stop offset="100%" stop-color="#182119"/>
    </linearGradient>
    <filter id="glow-aventor" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-aventor)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Urban Column with Hood -->
  <!-- Top Hood with Antenna -->
  <line x1="120" y1="24" x2="120" y2="40" stroke="#53ee81" stroke-width="2" filter="url(#glow-aventor)"/>
  <circle cx="120" cy="22" r="3.5" fill="#53ee81"/>

  <path d="M72 52 Q120 34 168 52 L172 64 L68 64 Z" fill="#007A33" stroke="#53ee81" stroke-width="1.2"/>

  <!-- Main Waste Drum -->
  <rect x="74" y="64" width="92" height="126" rx="8" fill="url(#aventor-pole)" stroke="#455747" stroke-width="1.5"/>

  <!-- Front Opening Slot -->
  <rect x="86" y="76" width="68" height="26" rx="6" fill="#0c130d" stroke="#53ee81" stroke-width="1.2"/>
  <line x1="94" y1="89" x2="146" y2="89" stroke="#53ee81" stroke-width="2" stroke-linecap="round" filter="url(#glow-aventor)"/>

  <!-- IoT Smart Sensor Badge -->
  <g transform="translate(90, 114)">
    <rect width="60" height="28" rx="4" fill="#101711" stroke="#334635" stroke-width="1"/>
    <!-- Wireless signal -->
    <path d="M16 16a8 8 0 0 1 12 0M20 20a3 3 0 0 1 4 0" stroke="#53ee81" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="22" cy="23" r="1.5" fill="#53ee81"/>
    <text x="34" y="21" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7" font-weight="700">TELEMETRIA</text>
  </g>

  <!-- Level indicator gauge -->
  <rect x="90" y="152" width="60" height="6" rx="3" fill="#0b110c" stroke="#2b3b2d" stroke-width="0.8"/>
  <rect x="92" y="154" width="40" height="2" rx="1" fill="#53ee81" filter="url(#glow-aventor)"/>

  <!-- Heavy Street Base Column -->
  <rect x="108" y="190" width="24" height="20" fill="#1b251d" stroke="#344336" stroke-width="1"/>
  <ellipse cx="120" cy="210" rx="54" ry="10" fill="#101711" stroke="#53ee81" stroke-opacity="0.6" stroke-width="1.2"/>

  <!-- Top Badge -->
  <g transform="translate(132, 14)">
    <rect width="94" height="18" rx="9" fill="#112918" stroke="#53ee81" stroke-width="1"/>
    <text x="47" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">URBANO CONECTADO</text>
  </g>
</svg>`
  },

  {
    id: 'prod-ossali',
    title: 'FPC ECO OSSALI',
    badge: 'VIAS PÚBLICAS',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-ossali" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c130e"/>
      <stop offset="100%" stop-color="#142116"/>
    </linearGradient>
    <linearGradient id="ossali-body" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#232e25"/>
      <stop offset="50%" stop-color="#344436"/>
      <stop offset="100%" stop-color="#1f2820"/>
    </linearGradient>
    <filter id="glow-ossali" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-ossali)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Compact Pedestrian Walkway Bin -->
  <!-- Top Roof -->
  <polygon points="68,54 172,54 180,44 60,44" fill="#007A33" stroke="#53ee81" stroke-width="1.2"/>

  <!-- Body -->
  <rect x="68" y="54" width="104" height="136" rx="6" fill="url(#ossali-body)" stroke="#455647" stroke-width="1.5"/>

  <!-- Dual slot aperture -->
  <rect x="78" y="66" width="84" height="22" rx="4" fill="#0d140e" stroke="#53ee81" stroke-opacity="0.8" stroke-width="1"/>
  <circle cx="92" cy="77" r="3" fill="#53ee81" filter="url(#glow-ossali)"/>
  <text x="122" y="80" fill="#e8ede5" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">PEDONAL MUNICIPAL</text>

  <!-- Metal Grille / Ventilation -->
  <g transform="translate(82, 102)">
    <rect width="76" height="48" rx="4" fill="#121a14" stroke="#2e3e30" stroke-width="0.8"/>
    <line x1="10" y1="12" x2="66" y2="12" stroke="#53ee81" stroke-opacity="0.5" stroke-width="1"/>
    <line x1="10" y1="24" x2="66" y2="24" stroke="#53ee81" stroke-opacity="0.5" stroke-width="1"/>
    <line x1="10" y1="36" x2="66" y2="36" stroke="#53ee81" stroke-opacity="0.5" stroke-width="1"/>
  </g>

  <!-- Municipal Tag -->
  <rect x="88" y="160" width="64" height="18" rx="4" fill="#101812" stroke="#53ee81" stroke-width="0.9"/>
  <text x="120" y="172" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7" font-weight="700" text-anchor="middle">CALÇADAS &amp; PRAÇAS</text>

  <!-- Pavement Base -->
  <rect x="56" y="190" width="128" height="14" rx="3" fill="#121813" stroke="#324134" stroke-width="1.2"/>
  <line x1="62" y1="197" x2="178" y2="197" stroke="#53ee81" stroke-opacity="0.6" stroke-width="1"/>

  <!-- Top Badge -->
  <g transform="translate(138, 14)">
    <rect width="88" height="18" rx="9" fill="#112918" stroke="#53ee81" stroke-width="1"/>
    <text x="44" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">VIAS PÚBLICAS</text>
  </g>
</svg>`
  },

  {
    id: 'prod-mbange',
    title: 'FPC ECO MBANGE',
    badge: 'COMÉRCIO LOCAL',
    render: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad-mbange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c120e"/>
      <stop offset="100%" stop-color="#142017"/>
    </linearGradient>
    <linearGradient id="mbange-body" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#232f26"/>
      <stop offset="50%" stop-color="#364738"/>
      <stop offset="100%" stop-color="#1e2720"/>
    </linearGradient>
    <filter id="glow-mbange" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="240" height="240" rx="20" fill="url(#bg-grad-mbange)"/>
  <rect width="238" height="238" x="1" y="1" rx="19" fill="none" stroke="#53ee81" stroke-opacity="0.2" stroke-width="1.5"/>

  <!-- Storefront Entry Compact Bin -->
  <!-- Beveled Lid -->
  <polygon points="72,50 168,50 160,38 80,38" fill="#007A33" stroke="#53ee81" stroke-width="1.2"/>

  <!-- Cabinet Body -->
  <rect x="72" y="50" width="96" height="136" rx="8" fill="url(#mbange-body)" stroke="#455948" stroke-width="1.5"/>

  <!-- Proximity sensor opening -->
  <rect x="82" y="62" width="76" height="24" rx="6" fill="#0d140e" stroke="#53ee81" stroke-width="1.2"/>
  <text x="120" y="77" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">SENSOR TOQUE ZERO</text>

  <!-- QR Reward Points Emblem -->
  <g transform="translate(94, 98)">
    <rect width="52" height="42" rx="4" fill="#121a14" stroke="#53ee81" stroke-opacity="0.7" stroke-width="1"/>
    <!-- QR matrix mini blocks -->
    <rect x="8" y="8" width="10" height="10" fill="#53ee81"/>
    <rect x="34" y="8" width="10" height="10" fill="#53ee81"/>
    <rect x="8" y="24" width="10" height="10" fill="#53ee81"/>
    <rect x="22" y="14" width="8" height="8" fill="#53ee81"/>
    <rect x="24" y="26" width="6" height="6" fill="#53ee81"/>
    <rect x="34" y="26" width="10" height="6" fill="#53ee81"/>
  </g>

  <!-- Foot pedal at bottom -->
  <rect x="92" y="174" width="56" height="8" rx="2" fill="#007A33" stroke="#53ee81" stroke-width="1"/>
  <line x1="98" y1="178" x2="142" y2="178" stroke="#53ee81" stroke-width="1.5" filter="url(#glow-mbange)"/>

  <!-- Non-slip Base feet -->
  <rect x="64" y="186" width="112" height="10" rx="3" fill="#111612" stroke="#324234" stroke-width="1.2"/>

  <!-- Top Badge -->
  <g transform="translate(136, 14)">
    <rect width="90" height="18" rx="9" fill="#122918" stroke="#53ee81" stroke-width="1"/>
    <text x="45" y="12" fill="#53ee81" font-family="'Lexend', sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">COMÉRCIO &amp; LOJAS</text>
  </g>
</svg>`
  }
];

const targetDirs = [
  path.join(__dirname, '..', 'public', 'landing-pages', 'inner-green-assets'),
  path.join(__dirname, '..', 'src', 'shaders', 'sylva-living-world', 'sources', 'inner-green-assets')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

products.forEach(p => {
  const content = p.render().trim();
  targetDirs.forEach(dir => {
    const filePath = path.join(dir, `${p.id}.svg`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Generated: ${filePath}`);
  });
});
