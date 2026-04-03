# Changelog

All notable changes to ChefMate POS will be documented in this file.

Format: [version] - YYYY-MM-DD | Types: Added Changed Fixed Removed

---

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
