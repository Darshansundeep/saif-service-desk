# Logo Customization Guide

This guide explains how to replace the placeholder logo with your company's actual logo.

## Quick Start

### Step 1: Prepare Your Logo

1. **Format**: PNG or SVG recommended (supports transparency)
2. **Size**: Minimum 200x200 pixels for best quality
3. **Aspect Ratio**: Square (1:1) or horizontal (2:1) works best
4. **File Size**: Keep under 500KB for optimal loading

### Step 2: Add Your Logo File

1. Place your logo file in the `/public` folder
2. Rename it to `logo.png` (or `logo.svg`)
3. Example path: `/public/logo.png`

### Step 3: Enable Your Logo

Open the file: `components/company-logo.tsx`

Find this line:
```typescript
const hasCustomLogo = false // Set to true when you add your logo
```

Change it to:
```typescript
const hasCustomLogo = true // Set to true when you add your logo
```

### Step 4: Update Company Name (Optional)

In the same file (`components/company-logo.tsx`), find:

```typescript
<span className={`font-bold ${textSize} leading-tight`}>
  Your Company
</span>
<span className="text-xs text-muted-foreground">
  Service Desk
</span>
```

Replace "Your Company" with your actual company name.

## Logo Appears In:

✅ **Header** - Top navigation bar on all pages  
✅ **Login Page** - Large logo above login form  
✅ **Signup Page** - Large logo above signup form  
✅ **Footer** - Small logo in footer (no text)  

## Logo Sizes

The logo component supports three sizes:

- **Small (sm)**: 32x32px - Used in header and footer
- **Medium (md)**: 48x48px - Default size
- **Large (lg)**: 64x64px - Used on login/signup pages

## Advanced Customization

### Use Different Logo File Name

If your logo has a different name (e.g., `company-logo.png`), update the Image src:

```typescript
<Image
  src="/company-logo.png"  // Change this
  alt="Company Logo"
  width={width}
  height={height}
  className="object-contain"
  priority
/>
```

### Use SVG Logo

SVG logos scale perfectly at any size:

1. Save your logo as `logo.svg` in `/public`
2. Update the src to `/logo.svg`

```typescript
<Image
  src="/logo.svg"
  alt="Company Logo"
  width={width}
  height={height}
  className="object-contain"
  priority
/>
```

### Hide Company Name Text

To show only the logo without text, set `showText={false}`:

```typescript
<CompanyLogo size="md" showText={false} />
```

### Custom Logo Styling

Add custom classes to the logo container:

```typescript
<CompanyLogo 
  size="md" 
  showText={true}
  className="custom-class"
/>
```

## Troubleshooting

### Logo Not Showing?

1. **Check file path**: Make sure logo is in `/public/logo.png`
2. **Check file name**: Must match exactly (case-sensitive)
3. **Check hasCustomLogo**: Must be set to `true`
4. **Clear cache**: Restart dev server with `npm run dev`
5. **Check browser**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Logo Too Large/Small?

Adjust the size prop:
```typescript
<CompanyLogo size="sm" />  // Small
<CompanyLogo size="md" />  // Medium
<CompanyLogo size="lg" />  // Large
```

### Logo Not Centered?

The logo uses `object-contain` which maintains aspect ratio. If your logo appears off-center, check:

1. Your logo file has transparent background
2. The logo content is centered in the image file
3. Try adjusting the container with custom CSS

### Logo Quality Issues?

1. Use higher resolution source image (at least 200x200px)
2. Use SVG format for perfect scaling
3. Ensure logo has transparent background (PNG or SVG)

## File Locations

- **Logo Component**: `components/company-logo.tsx`
- **Logo File**: `public/logo.png` (or `logo.svg`)
- **Header**: `components/header.tsx`
- **Footer**: `components/footer.tsx`
- **Auth Form**: `components/auth-form.tsx`

## Example: Complete Customization

```typescript
// components/company-logo.tsx

const hasCustomLogo = true // Enable custom logo

// Update company name
<span className={`font-bold ${textSize} leading-tight`}>
  Acme Corporation
</span>
<span className="text-xs text-muted-foreground">
  IT Support Portal
</span>

// Use custom logo file
<Image
  src="/acme-logo.png"
  alt="Acme Corporation Logo"
  width={width}
  height={height}
  className="object-contain"
  priority
/>
```

## Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Verify file paths are correct
3. Ensure the logo file is accessible at `http://localhost:3000/logo.png`
4. Restart the development server

---

**Note**: After making changes, you may need to restart the development server and clear your browser cache to see the updates.
