#!/bin/bash

# Script to create placeholder logo files
# These are temporary SVG files that will display until real logos are added

cd "$(dirname "$0")"

# Create the logos directory if it doesn't exist
mkdir -p frontend/public/logos

# Create main logo placeholder (SVG with Hebrew text)
cat > frontend/public/logos/main-logo.svg << 'EOF'
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c2410c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" rx="8" fill="url(#mainGrad)"/>
  <text x="100" y="40" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">רעננה</text>
</svg>
EOF

# Create secondary logo placeholder (SVG with house icon)
cat > frontend/public/logos/secondary-logo.svg << 'EOF'
<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="60" height="60" rx="8" fill="url(#secGrad)"/>
  <!-- House icon -->
  <path d="M30 15 L45 27 L45 45 L35 45 L35 35 L25 35 L25 45 L15 45 L15 27 Z" fill="white" stroke="white" stroke-width="1.5"/>
  <!-- Tree icon -->
  <circle cx="48" cy="23" r="4" fill="white" opacity="0.8"/>
  <rect x="47" y="27" width="2" height="6" fill="white" opacity="0.8"/>
</svg>
EOF

echo "✓ Created placeholder logo files in frontend/public/logos/"
echo ""
echo "Note: These are temporary SVG placeholders."
echo "Please replace them with the actual PNG logo files:"
echo "  1. main-logo.png (Ra'anana Hebrew text logo)"
echo "  2. secondary-logo.png (Community emblem with house/tree)"
echo ""
echo "See LOGO_SETUP.md for detailed instructions."


