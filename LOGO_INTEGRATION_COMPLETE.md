# Logo Integration - Quick Start

## ✅ What's Been Done

The Community Tax Management System now displays **two logos** throughout the application:

1. **Main Logo** (Hebrew "רעננה" text) - Positioned on the left
2. **Secondary Logo** (Community emblem with house/tree) - Positioned in the center

### Locations Where Logos Appear:
- **Navigation Header** (after login) - Both logos side by side
- **Login Page Header** - Both logos prominently displayed

### Files Modified:
- ✅ `frontend/src/components/Logo.jsx` - New reusable logo components
- ✅ `frontend/src/App.jsx` - Navigation header updated
- ✅ `frontend/src/pages/Login.jsx` - Login page header updated

### Placeholder Logos Created:
- ✅ `frontend/public/logos/main-logo.svg` - Temporary Hebrew text placeholder
- ✅ `frontend/public/logos/secondary-logo.svg` - Temporary house icon placeholder

## 🎯 Next Steps: Add Your Actual Logos

### Quick Instructions:

1. **Save your logo images** to these exact paths:
   ```
   frontend/public/logos/main-logo.png    (Hebrew רעננה logo)
   frontend/public/logos/secondary-logo.png    (House/tree emblem)
   ```

2. **Image specifications:**
   - Format: PNG with transparent background
   - Main logo: Height ~60-80px
   - Secondary logo: Height ~50-70px
   - Keep aspect ratio

3. **Test the logos:**
   ```bash
   cd frontend
   npm run dev
   ```
   Then visit: http://localhost:5173

### Alternative: Keep Using SVG Placeholders

The SVG placeholders will display automatically if PNG files aren't found. They show:
- **Main logo**: Orange gradient with "רעננה" text
- **Secondary logo**: Blue gradient with house icon

## 🔄 Logo Loading Logic

The system tries to load logos in this order:
1. First: `.svg` file (current placeholder)
2. Then: `.png` file (your actual logo)
3. Finally: Inline fallback component

Simply add your PNG files and they'll override the SVG placeholders!

## 📁 File Structure

```
frontend/
├── public/
│   └── logos/
│       ├── main-logo.svg         (temporary placeholder)
│       ├── main-logo.png         (← add your logo here)
│       ├── secondary-logo.svg    (temporary placeholder)
│       └── secondary-logo.png    (← add your logo here)
└── src/
    ├── components/
    │   └── Logo.jsx              (logo components)
    ├── App.jsx                   (uses logos in nav)
    └── pages/
        └── Login.jsx             (uses logos in header)
```

## 🎨 Design Details

The logos are displayed with:
- Responsive sizing
- Automatic fallbacks if images fail
- Clean separation with a vertical divider
- Proper spacing and alignment
- Works on all screen sizes

## 📝 Additional Resources

See `LOGO_SETUP.md` for detailed instructions and troubleshooting.

---

**Status**: ✅ Logo integration complete - Ready for production logos


