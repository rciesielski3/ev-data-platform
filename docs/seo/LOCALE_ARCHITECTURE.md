# Locale Architecture — EVSource

## Overview

The EVSource application uses a **cookie-based locale resolution** system, not URL-path-based routing. This fundamental architectural characteristic has critical implications for SEO practices like hreflang tags and sitemap language alternates.

## Current Locale Resolution

### How Locale is Determined

The application resolves the user's preferred locale through the following priority order:

1. **Cookie** (highest priority): If a locale is stored in the `NEXT_LOCALE` cookie, that value is used
2. **Accept-Language Header** (fallback): If no cookie is present, the server examines the HTTP `Accept-Language` header
   - Prefers Polish (pl) if present in the header
   - Falls back to English (en) if Polish isn't available
3. **Default Locale** (last resort): If neither cookie nor header provides a match, defaults to Polish ('pl')

### Implementation Details

- **Cookie**: `NEXT_LOCALE`, set by the client-side `setLocale()` function (src/lib/i18n/set-locale.ts)
- **Server-side resolution**: Uses `next-intl`'s `getLocale()` function (called from server components)
- **Supported locales**: 'pl' (Polish), 'en' (English)
- **Default locale**: 'pl' (Polish)

### Code References

- Locale resolution: `src/lib/i18n/locale.ts`
- Locale constants: `src/lib/i18n/constants.ts`
- Client-side setter: `src/lib/i18n/set-locale.ts`
- Usage in pages: All server components in `src/app/**/page.tsx` call `getLocale()`

## Route Structure

### No [locale] Route Segment

The application does **NOT** use a `[locale]` dynamic route segment. This means:

- There is no `/pl/*` route hierarchy
- There is no `/en/*` route hierarchy
- All routes are locale-agnostic at the path level

### URL Examples

| URL Path | Resolved Locale |
|----------|---|
| `/` | Determined by cookie/header, not URL |
| `/stations` | Determined by cookie/header, not URL |
| `/stations/123` | Determined by cookie/header, not URL |
| `/map` | Determined by cookie/header, not URL |
| `/vehicles` | Determined by cookie/header, not URL |

**Important**: URLs like `/pl/stations` and `/en/stations` do **not exist** and will return 404 errors.

## Impact on SEO

### Hreflang Alternates

**Current Status**: The layout.tsx and sitemap.ts files currently include hreflang alternates referencing `/pl/` and `/en/` URLs, which are **broken**.

**Example of the problem** (from layout.tsx):
```typescript
alternates: {
  languages: {
    pl: `${SITE_URL}/pl`,        // ❌ This URL doesn't exist
    en: `${SITE_URL}/en`,        // ❌ This URL doesn't exist
  },
},
```

**Why this breaks**:
- Search engines crawl the hreflang alternates
- They find 404 errors instead of valid page content
- This signals to search engines that the hreflang configuration is broken
- Search engines may ignore the hreflang hints entirely

### Sitemap Language Alternates

**Current Status**: The sitemap.ts file includes language alternates for all URLs.

**Example of the problem** (from sitemap.ts):
```typescript
alternates: {
  languages: {
    pl: `${SITE_URL}/pl${route.path}`,     // ❌ Broken link
    en: `${SITE_URL}/en${route.path}`,     // ❌ Broken link
  },
},
```

## Correct Approach for Multi-Language SEO

### What to Use Instead of Hreflang/URL Alternates

1. **HTTP `Content-Language` Header**
   - The server should send `Content-Language: pl` or `Content-Language: en` based on the resolved locale
   - This tells search engines (and browsers) what language the content is in

2. **HTML `lang` Attribute**
   - Already correctly implemented in layout.tsx: `<html lang={locale}>`
   - This semantic marker helps search engines identify the page language

3. **Language Switcher UI**
   - Already implemented via `LanguageSwitcher` component
   - Allows users to explicitly choose their preferred language
   - Sets the `NEXT_LOCALE` cookie for persistence

### Why Hreflang URLs Don't Apply Here

Hreflang alternates are meant for situations where:
- The same content exists at different URLs (e.g., `/pl/products` vs `/en/products`)
- Search engines need to understand that these URLs serve the same content in different languages

Since this application uses **cookie-based locale resolution**, not URL-based routing:
- The same URL (`/stations`) serves both Polish and English content
- The language served depends on the cookie/header, not the URL
- Hreflang alternates don't apply to this architecture

## Recommendations

### For SEO Implementation

1. **Remove hreflang alternates** from:
   - `src/app/layout.tsx` (lines 46-51 in metadata)
   - `src/app/sitemap.ts` (lines 30-35, 42-47, 64-69, 78-83)

2. **Ensure Content-Language header** is sent by the server
   - Can be added to Next.js middleware or per-route handlers
   - Should reflect the resolved locale

3. **Keep HTML lang attribute** (already correct)
   - No changes needed to `<html lang={locale}>`

4. **Verify domain consistency** in all SEO metadata
   - Ensure `SITE_URL` consistently references the correct domain
   - All URLs should use the canonical domain

### For Future Considerations

If the team decides to implement **URL-based locale routing** in the future:
- This would require creating a `[locale]` route segment
- Implementing a catch-all route to handle non-locale paths
- Migrating all existing URLs to include locale prefixes
- This is a significant architectural change and would require extensive refactoring

The current cookie-based approach is simpler and works well for a global audience. URL-based routing would be better if the goal was to create locale-specific subdomains or SEO properties.

## Summary

- **Architecture**: Cookie-based locale resolution (NOT URL path-based)
- **Routes**: All locale-agnostic (no `/pl` or `/en` prefixes)
- **Hreflang Status**: Currently broken (references non-existent URLs)
- **Correct SEO signals**: Content-Language header + HTML lang attribute
- **Action needed**: Remove hreflang alternates, verify Content-Language header
