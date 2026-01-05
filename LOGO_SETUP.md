# Adding Logos to the Application

## Overview
The application has been updated to display two logos:
1. **Main Logo** (main-logo.png) - The Hebrew "רעננה" (Ra'anana) logo
2. **Secondary Logo** (secondary-logo.png) - The community/neighborhood emblem with house and tree design

## Logo File Locations
Both logo files should be placed in:
```
/Users/alonmiron/dad_test/frontend/public/logos/
```

## Required Files
1. `main-logo.png` - Ra'anana Municipality logo (Hebrew text)
2. `secondary-logo.png` - Community emblem (house/tree design)

## How to Add the Logos

### Option 1: Manual Save (Recommended)
1. Save the first logo (Hebrew text "רעננה") as:
   ```
   /Users/alonmiron/dad_test/frontend/public/logos/main-logo.png
   ```

2. Save the second logo (house and tree emblem) as:
   ```
   /Users/alonmiron/dad_test/frontend/public/logos/secondary-logo.png
   ```

### Option 2: Using macOS Screenshot/Drag-and-Drop
If you have the images visible:
1. Take screenshots of each logo
2. Crop them to remove excess white space
3. Save with transparent backgrounds if possible
4. Rename and move to the logos folder

### Option 3: From Browser/Source
If these logos are from a website:
1. Right-click on each logo image
2. Select "Save Image As..."
3. Save to the `frontend/public/logos/` directory
4. Rename appropriately

## Image Specifications
- **Format**: PNG (recommended for transparency)
- **Main Logo**: Suggested height ~60-80px, transparent background
- **Secondary Logo**: Suggested height ~50-70px, transparent background
- **Optimization**: Use ImageOptim or similar to reduce file size

## Fallback Behavior
The application includes fallback placeholders if the images fail to load:
- Main Logo: Orange gradient box with Hebrew letter "ר"
- Secondary Logo: Blue gradient box with house icon

## Testing
After adding the logos:
1. Start the frontend development server:
   ```bash
   cd /Users/alonmiron/dad_test/frontend
   npm run dev
   ```

2. Visit http://localhost:5173
3. Check both the login page and main navigation header
4. Verify logos display correctly on both desktop and mobile views

## Troubleshooting
- If logos don't appear, check browser console for 404 errors
- Verify file paths are correct (case-sensitive on some systems)
- Ensure files are in the `public/logos/` directory (not `src/`)
- Clear browser cache if updating existing logos

## Components Updated
The following files have been modified to support the logos:
- `/frontend/src/components/Logo.jsx` (new component)
- `/frontend/src/App.jsx` (navigation header)
- `/frontend/src/pages/Login.jsx` (login page header)


