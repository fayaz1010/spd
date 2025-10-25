# Sun Direct Power - Company Logos

This folder contains all company logos and branding assets used throughout the application.

## Required Logo Files

### 1. **sdp-logo-large.png**
- **Size:** 800x200px (or similar aspect ratio)
- **Format:** PNG with transparent background
- **Usage:** 
  - PDF documents (quotes, invoices, certificates)
  - Email headers
  - Print materials
- **Requirements:** High resolution (300 DPI for print)

### 2. **sdp-logo-medium.png**
- **Size:** 400x100px (or similar aspect ratio)
- **Format:** PNG with transparent background
- **Usage:**
  - Website header
  - Email templates
  - Admin dashboard
- **Requirements:** Web-optimized, under 50KB

### 3. **sdp-logo-small.png**
- **Size:** 200x50px (or similar aspect ratio)
- **Format:** PNG with transparent background
- **Usage:**
  - Mobile header
  - Footer
  - Small UI elements
- **Requirements:** Web-optimized, under 20KB

### 4. **sdp-favicon.ico**
- **Size:** 32x32px (multi-size ICO file: 16x16, 32x32, 48x48)
- **Format:** ICO format
- **Usage:**
  - Browser tab icon
  - Bookmarks
  - Desktop shortcuts
- **Requirements:** Square icon, recognizable at small sizes

---

## Additional Recommended Assets

### 5. **sdp-logo-white.png** (Optional)
- For use on dark backgrounds
- Same sizes as above
- White or light-colored version

### 6. **sdp-logo-square.png** (Optional)
- Square version for social media
- 512x512px minimum
- For Facebook, LinkedIn, etc.

### 7. **sdp-watermark.png** (Optional)
- Semi-transparent watermark for documents
- 300x75px
- 30% opacity

---

## File Naming Convention

- Use lowercase
- Use hyphens (not underscores)
- Be descriptive
- Include size if multiple versions

Examples:
- `sdp-logo-large.png`
- `sdp-logo-medium-white.png`
- `sdp-icon-512.png`

---

## Color Specifications

### Primary Brand Colors
- **Primary Blue:** #1E40AF (or your actual brand color)
- **Coral/Orange:** #FF6B35 (accent color)
- **Gold:** #FFD700 (solar theme)
- **Dark:** #1F2937 (text)
- **Light:** #F9FAFB (backgrounds)

⚠️ **Update these colors to match your actual brand guidelines**

---

## Logo Usage Guidelines

### ✅ DO:
- Use official logo files only
- Maintain aspect ratio
- Ensure adequate clear space around logo
- Use on appropriate backgrounds (light logo on dark, dark logo on light)
- Keep logos crisp and clear

### ❌ DON'T:
- Stretch or distort the logo
- Change logo colors (unless using approved variations)
- Add effects (shadows, gradients, etc.)
- Use low-resolution versions
- Place on busy backgrounds

---

## Where Logos Are Used

### Website
- Header: `/components/Header.tsx` → `logoMedium`
- Footer: `/components/Footer.tsx` → `logoSmall`
- Favicon: `/app/layout.tsx` → `favicon`

### Documents (PDFs)
- Quotes: `/app/api/quotes/[id]/pdf/` → `logoLarge`
- Invoices: `/app/api/invoices/[id]/pdf/` → `logoLarge`
- Certificates: `/app/api/certificates/[id]/pdf/` → `logoLarge`
- SLD Diagrams: `/app/api/admin/design/sld/[id]/export/pdf/` → `logoMedium`

### Email Templates
- All emails: `/lib/email-templates/` → `logoMedium`

### Admin Dashboard
- Login page: `/app/admin/login/` → `logoLarge`
- Dashboard header: `/app/admin/dashboard/` → `logoMedium`

---

## Current Status

⚠️ **PLACEHOLDER FILES NEEDED**

The following files are referenced in the system but not yet created:
- [ ] sdp-logo-large.png
- [ ] sdp-logo-medium.png
- [ ] sdp-logo-small.png
- [ ] sdp-favicon.ico

---

## How to Add Your Logos

### Option 1: Manual Upload
1. Create your logo files according to specifications above
2. Save them in this folder (`/public/logos/`)
3. Use exact filenames listed above
4. Refresh your application

### Option 2: Design Tools
- **Canva:** Create logos online (free tier available)
- **Adobe Illustrator:** Professional vector logos
- **Figma:** Collaborative design
- **GIMP:** Free alternative to Photoshop

### Option 3: Hire a Designer
- Fiverr: Budget-friendly logo design
- 99designs: Logo contests
- Upwork: Professional designers
- Local graphic designers

---

## Favicon Generation

To create a proper multi-size favicon.ico:

1. **Online Tools:**
   - https://favicon.io/
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **Upload your logo** (square version works best)
3. **Download the generated .ico file**
4. **Save as** `sdp-favicon.ico` in this folder

---

## Testing Your Logos

After adding logos, test them in:

1. **Website Header** - Visit homepage
2. **Browser Tab** - Check favicon appears
3. **PDF Documents** - Generate a test quote
4. **Email** - Send a test email
5. **Mobile** - Check responsive sizing
6. **Print** - Print a test document

---

## File Size Optimization

Keep file sizes small for web performance:

- **Large logo:** < 100KB
- **Medium logo:** < 50KB
- **Small logo:** < 20KB
- **Favicon:** < 10KB

**Tools for optimization:**
- TinyPNG: https://tinypng.com/
- ImageOptim: https://imageoptim.com/
- Squoosh: https://squoosh.app/

---

## Support

If you need help with logos:
1. Check this README
2. Review brand guidelines (if available)
3. Contact your designer
4. Ask the development team

---

**Last Updated:** October 24, 2025
**Maintained By:** Sun Direct Power Development Team
