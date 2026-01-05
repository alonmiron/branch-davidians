# Logo Files Directory

## 📋 Quick Instructions

This folder should contain your two logo image files:

### Required Files:
1. **`main-logo.png`** 
   - The Hebrew "רעננה" (Ra'anana) municipality logo
   - Recommended size: ~200px width × 60-80px height
   - Format: PNG with transparent background

2. **`secondary-logo.png`**
   - The community/neighborhood emblem (house and tree design)
   - Recommended size: ~60px × 60px (square)
   - Format: PNG with transparent background

## 🎯 How to Add Your Logos

### Method 1: Drag and Drop (Easiest)
1. This Finder window should already be open
2. Locate your logo files on your computer
3. Drag them into this folder
4. Rename them to exactly: `main-logo.png` and `secondary-logo.png`

### Method 2: Save From Browser
If your logos are from a website:
1. Right-click on the image → "Save Image As..."
2. Save directly to this folder
3. Name them: `main-logo.png` and `secondary-logo.png`

### Method 3: Screenshot and Crop
If you see the logos on screen:
1. Take a screenshot (Cmd+Shift+4)
2. Open in Preview and crop to remove whitespace
3. Export as PNG
4. Save to this folder with correct names

## 📁 Current Files

- ✅ `main-logo.svg` - Temporary placeholder (orange gradient with Hebrew text)
- ✅ `secondary-logo.svg` - Temporary placeholder (blue gradient with house icon)
- ⏳ `main-logo.png` - **← Add your actual Ra'anana logo here**
- ⏳ `secondary-logo.png` - **← Add your actual community emblem here**

## 🔄 How It Works

The application will automatically:
1. First try to load `.svg` files (current placeholders)
2. Then try to load `.png` files (your actual logos)
3. If both fail, show a built-in fallback design

**Simply add your PNG files and they'll appear immediately!**

## ✅ Testing

After adding your logo files:

1. Start the development server:
   ```bash
   cd /Users/alonmiron/dad_test/frontend
   npm run dev
   ```

2. Open in browser: http://localhost:5173

3. Check both locations:
   - Login page header (before signing in)
   - Navigation bar (after signing in)

4. Verify logos look good:
   - Proper size and alignment
   - Clear and readable
   - Transparent backgrounds work
   - No pixelation or stretching

## 🎨 Image Specifications

### Ideal Settings:
- **Format**: PNG-24 with alpha transparency
- **Resolution**: 2x for retina displays (e.g., 400×120px for main logo)
- **Color mode**: RGB
- **Background**: Transparent
- **File size**: Keep under 50KB each for fast loading
- **Compression**: Use "Save for Web" or ImageOptim

### Dimensions:
- **Main logo**: Width 150-250px, Height 50-80px (landscape)
- **Secondary logo**: 50-80px × 50-80px (square or similar)

## 🛠️ Troubleshooting

### Logos don't appear?
- Check file names exactly match: `main-logo.png` and `secondary-logo.png`
- Check files are in this folder: `/Users/alonmiron/dad_test/frontend/public/logos/`
- Clear browser cache (Cmd+Shift+R)
- Check browser console for 404 errors

### Logos look pixelated?
- Use higher resolution images (2x size)
- Save as PNG, not JPG
- Ensure original image is high quality

### Logos have white background?
- Re-export with transparency enabled
- Use PNG-24 format, not PNG-8
- Check "Alpha Channel" is enabled in your image editor

## 📚 More Info

- See `LOGO_INTEGRATION_COMPLETE.md` in project root for full details
- See `LOGO_LAYOUT_GUIDE.md` for visual layout specifications
- See `LOGO_SETUP.md` for detailed troubleshooting

---

**Status**: ⏳ Waiting for production logo files

Once you add `main-logo.png` and `secondary-logo.png`, this status will update to: ✅ Production logos active


