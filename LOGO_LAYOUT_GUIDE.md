# Logo Display Layout

## Navigation Header (After Login)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [Hebrew Logo]  │  [House Logo]    Community Tax                   [User]   │
│   (main-logo)   │  (secondary)     Management System               Logout   │
│                                                                              │
│     Dashboard   Customers   Payments   Batch   Failed                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Specifications:
- **Main Logo** (Hebrew רעננה): Height 48px, left-aligned
- **Secondary Logo** (House/Tree): Height 40px, separated by vertical line
- **Text**: "Community Tax Management System" next to logos
- **Spacing**: Clean, professional layout with proper spacing

---

## Login Page Header

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [Hebrew Logo]  │  [House Logo]    Community Tax Management                 │
│   (Height 56px) │  (Height 48px)   Billing & Payment System                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Specifications:
- **Main Logo**: Height 56px (slightly larger for prominence)
- **Secondary Logo**: Height 48px
- **Text**: Larger heading with subtitle
- **Background**: White with subtle border

---

## Logo Files

### Current Status:

#### Placeholder Files (Active):
- ✅ `main-logo.svg` - Orange gradient with Hebrew text "רעננה"
- ✅ `secondary-logo.svg` - Blue gradient with house icon

#### Waiting for Production Files:
- ⏳ `main-logo.png` - Actual Ra'anana municipality logo
- ⏳ `secondary-logo.png` - Actual community emblem

---

## How It Works

### Loading Priority:
1. Try to load `.svg` file (current placeholder)
2. If fails, try `.png` file (your production logo)
3. If both fail, show inline React component fallback

### Code Flow:
```javascript
// Component tries SVG first
<img src="/logos/main-logo.svg" />
  ↓ (if error)
<img src="/logos/main-logo.png" />
  ↓ (if error)
<InlineFallbackComponent />
```

---

## Responsive Behavior

### Desktop (> 768px):
- Both logos visible
- Full text shown
- Optimal spacing

### Tablet (768px - 1024px):
- Both logos visible
- Slightly reduced spacing
- Full functionality

### Mobile (< 768px):
- Logos stack or resize
- Text adjusts
- Menu may collapse

---

## Color Scheme

### Main Logo (Ra'anana):
- Primary: Orange (#ea580c to #c2410c gradient)
- Fallback: Orange gradient box with Hebrew letter "ר"

### Secondary Logo (Community):
- Primary: Blue (#3b82f6 to #2563eb gradient)
- Fallback: Blue gradient box with house icon

### Overall Theme:
- Background: White navigation with subtle shadow
- Text: Dark gray (#1f2937)
- Accents: Blue for interactive elements

---

## File Formats Supported

- ✅ **PNG** (recommended) - Best for logos with transparency
- ✅ **SVG** (current placeholders) - Scalable, small file size
- ✅ **JPG** (not recommended) - No transparency support
- ✅ **WEBP** - Modern format, good compression

### Recommended Specifications:
- **Format**: PNG-24 with alpha channel (transparency)
- **Resolution**: 2x for retina displays
- **File size**: < 50KB each
- **Dimensions**: 
  - Main logo: ~200px width × 60px height
  - Secondary logo: ~60px × 60px (square or similar)

---

## Testing Checklist

- [ ] Logos appear on login page
- [ ] Logos appear in navigation after login
- [ ] Logos have proper spacing
- [ ] Logos are aligned correctly
- [ ] Text is readable next to logos
- [ ] Logos scale properly on mobile
- [ ] Fallback works if images removed
- [ ] No console errors
- [ ] Logos load quickly
- [ ] Transparent backgrounds work correctly

---

## Quick Commands

```bash
# Open logo directory in Finder
open /Users/alonmiron/dad_test/frontend/public/logos

# List current logo files
ls -lh /Users/alonmiron/dad_test/frontend/public/logos/*.{png,svg}

# Start dev server to preview
cd /Users/alonmiron/dad_test/frontend && npm run dev

# Check if logos are loading (check browser network tab)
# Visit: http://localhost:5173
```

---

**Last Updated**: January 4, 2026


