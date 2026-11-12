import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'public/templates');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1920 x 1358 standard certificate landscape aspect ratio (A4 landscape ~ 1.414)
const width = 1920;
const height = 1358;

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCFDFF"/>
      <stop offset="50%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="25%" stop-color="#FFDF73"/>
      <stop offset="50%" stop-color="#AA771C"/>
      <stop offset="75%" stop-color="#F3C64F"/>
      <stop offset="100%" stop-color="#8A5A00"/>
    </linearGradient>

    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A192F"/>
      <stop offset="50%" stop-color="#0B3D91"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>

    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/>
      <stop offset="50%" stop-color="#FFB300"/>
      <stop offset="100%" stop-color="#FF8F00"/>
    </linearGradient>

    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

  <!-- Subtle Guilloche / Grid Pattern Background Lines -->
  <g opacity="0.04" stroke="#0B3D91" stroke-width="1.5">
    <pattern id="guilloche" width="60" height="60" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="28" fill="none"/>
      <circle cx="30" cy="30" r="18" fill="none"/>
      <circle cx="30" cy="30" r="8" fill="none"/>
    </pattern>
    <rect width="${width}" height="${height}" fill="url(#guilloche)"/>
  </g>

  <!-- Outer Double Border -->
  <rect x="50" y="50" width="${width - 100}" height="${height - 100}" rx="6" fill="none" stroke="url(#goldGrad)" stroke-width="10"/>
  <rect x="70" y="70" width="${width - 140}" height="${height - 140}" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
  <rect x="80" y="80" width="${width - 160}" height="${height - 160}" fill="none" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="6 6"/>

  <!-- Top-Left Corner Geometric Accent (Navy & Gold Ribbons) -->
  <g>
    <!-- Dark Navy polygon -->
    <polygon points="0,0 520,0 0,520" fill="url(#navyGrad)"/>
    <!-- Gold stripe 1 -->
    <polygon points="520,0 550,0 0,550 0,520" fill="url(#goldGrad)"/>
    <!-- Lighter accent strip -->
    <polygon points="560,0 575,0 0,575 0,560" fill="url(#goldGrad)" opacity="0.8"/>
  </g>

  <!-- Bottom-Right Corner Geometric Accent (Navy & Gold Ribbons) -->
  <g>
    <polygon points="${width},${height} ${width - 520},${height} ${width},${height - 520}" fill="url(#navyGrad)"/>
    <polygon points="${width - 520},${height} ${width - 550},${height} ${width},${height - 550} ${width},${height - 520}" fill="url(#goldGrad)"/>
    <polygon points="${width - 560},${height} ${width - 575},${height} ${width},${height - 575} ${width},${height - 560}" fill="url(#goldGrad)" opacity="0.8"/>
  </g>

  <!-- Corner Ornamental Corner Details (Top Right & Bottom Left) -->
  <g stroke="url(#goldGrad)" stroke-width="3" fill="none">
    <path d="M ${width - 120} 90 L ${width - 90} 90 L ${width - 90} 120"/>
    <path d="M 90 ${height - 120} L 90 ${height - 90} L 120 ${height - 90}"/>
  </g>

  <!-- Bottom Gold Medallion / Official Seal -->
  <g transform="translate(${width / 2}, ${height - 240})" filter="url(#shadow)">
    <!-- Ribbons -->
    <polygon points="-40,40 -60,130 -20,110 0,130 -10,40" fill="#D97706"/>
    <polygon points="40,40 60,130 20,110 0,130 10,40" fill="#B45309"/>

    <!-- Seal Outer Sunburst -->
    <circle cx="0" cy="0" r="76" fill="url(#goldGrad)"/>
    <circle cx="0" cy="0" r="66" fill="#F8FAFC" stroke="url(#goldGrad)" stroke-width="4"/>
    <circle cx="0" cy="0" r="58" fill="url(#sealGrad)"/>
    <circle cx="0" cy="0" r="48" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 3"/>

    <!-- Star icon inside seal -->
    <polygon points="0,-24 7,-7 25,-7 11,5 16,22 0,12 -16,22 -11,5 -25,-7 -7,-7" fill="#FFFFFF" opacity="0.95"/>
    <text x="0" y="32" font-family="'Montserrat', sans-serif" font-size="10" font-weight="bold" fill="#78350F" text-anchor="middle" letter-spacing="2">OFFICIAL SEAL</text>
  </g>

  <!-- Subtle Signature Baseline Guides -->
  <line x1="280" y1="${height - 220}" x2="620" y2="${height - 220}" stroke="#94A3B8" stroke-width="1.5"/>
  <line x1="${width - 620}" y1="${height - 220}" x2="${width - 280}" y2="${height - 220}" stroke="#94A3B8" stroke-width="1.5"/>
</svg>`;

fs.writeFileSync(path.join(outDir, 'certificate-bg.svg'), svgContent, 'utf-8');
// Also write to public/certificate-bg.svg and public/templates/certificate-bg.jpg
fs.writeFileSync(path.resolve(process.cwd(), 'public/certificate-bg.svg'), svgContent, 'utf-8');
console.log('Generated certificate-bg.svg successfully');
