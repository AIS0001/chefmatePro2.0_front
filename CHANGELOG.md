# Changelog
---

## [2.0.4] - 2026-04-04

### Fixed
- Analytics dashboard now uses live data more reliably instead of showing sample product and category data when the API returns placeholder values.
- Analytics dashboard refresh button is now clearly visible, and warning messages no longer push the whole page content down.
- Food, bar, shisha, sales, purchase, and order status sections were cleaned up so empty or failed API responses show safe fallback states instead of stale-looking data.
- Main dashboard layout spacing was improved so content lines up better with the sidebar and topbar.
- Main page content now keeps a small left-side gap from the sidebar instead of touching it directly.
- Mobile sidebar now displays menu items correctly on small screens and keeps the same dark theme as the desktop sidebar.
- Favicon path was corrected so the browser no longer requests `/dashboard/favicon.ico` on nested routes.
- Unused sparkline vendor script was removed from the app shell, which stops an unnecessary request that was causing browser warnings in local development.
- Topbar WebSocket now connects using the backend API host instead of the frontend host, which improves local and production notification connection behavior.

### Changed
- Topbar debug console output was commented out to keep the browser console cleaner.
- Dashboard analytics panels were reorganized to show clearer live sections such as order status, sales vs purchases, and purchase trend.

## [2.0.3] - 2026-04-03

### Changed
- Thermal KOT HTML print readability improved in POS (`src/views/pos/newPOS.jsx`):
   - Increased thermal HTML font sizing (including fallback print path)
   - Enabled bold text across KOT thermal HTML templates
   - Footer timestamp and thank-you text switched to Arial for better visibility
   - KOT timestamp text color updated to pure black (`#000`)
- Thermal bill HTML print readability improved (`src/components/Modals/CheckBillModal.jsx`):
   - Increased thermal bill HTML font sizes to improve print clarity
   - No changes made to ESC/POS print logic

---

## [2.0.2] - 2026-04-02

### Added
- Footer version now links to in-app changelog (`/changelog`)

### Changed
- Topbar Business Date now uses setup date from `getNextSetupDate()`
- Business Date refresh logic runs every 60 seconds to keep display in sync
- Build workflow continues to sync `CHANGELOG.md` into `public/CHANGELOG.md`

---
## [2.0.1] - 2026-04-02

### Added
- In-app Changelog page at /changelog
- Topbar version label now opens in-app changelog
- Build/start changelog sync so latest updates are always served in public/CHANGELOG.md

### Changed
- Changelog page renders version sections with expand/collapse
- Changelog content now loads from static CHANGELOG.md asset

---

## [2.0.0] - 2026-01-01

### Added
- Initial release of ChefMate POS system

---

<!-- HOW TO UPDATE THIS FILE
1. Bump version in package.json (npm version patch/minor/major)
2. Add a new section at the top:
   ## [X.Y.Z] - YYYY-MM-DD
3. List changes under Added / Changed / Fixed / Removed
-->
