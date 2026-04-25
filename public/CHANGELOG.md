# Changelog
---

## [3.1.0] - 2026-04-25

### Added
- Entertainment Reports page (`/reports/entertainment`) showing date-wise food, bar, and shisha totals for entertainment-mode bills.
- Group Wise Day-wise Reports page (`/reports/groupwise`) showing per-day group totals for non-entertainment bills.
- Backend API endpoint `GET /api/entertainment-report` with shop_id filter, date range, and dynamic schema detection.
- Backend API endpoint `GET /api/groupwise-daywise-report` with shop_id filter, date range, and dynamic schema detection.
- Both new report pages added to the Reports submenu in `MenuItems.js` and `Menu_item_vat.js` for GST and VAT menu layouts.

### Changed
- Report controller uses dynamic column detection to handle varying `order_items` table schemas across deployments.
- Analytics controller `getTopSellingProducts` updated to use dynamic revenue expressions to avoid missing-column errors.

### Fixed
- Resolved `ER_CANT_AGGREGATE_2COLLATIONS` SQL error in report queries by normalising all string comparisons to `utf8mb4_unicode_ci` collation.
- Resolved 500 errors caused by incorrect destructuring of database pool import in report controller.

---

## [2.0.9] - 2026-04-12

### Added
- POS item cards now show a red quantity badge at the top-right corner when the item exists in the cart.

### Changed
- Cashier dashboard was decluttered to focus on primary action cards with cleaner hierarchy and less non-essential visual noise.
- Cashier dashboard card content and responsive behavior were refined for desktop, tablet, and mobile screen sizes.
- POS item image blocks now use a consistent square media frame with `object-fit: cover` to eliminate top and bottom whitespace.
- POS item name/price typography and spacing were adjusted so names stay prominent and prices no longer appear detached.
- POS mobile layout was improved so Quick Add and cart sections stack more naturally on small screens.
- Quick Add panel behavior on mobile was improved by pinning it while cart rows scroll beneath it.
- Support Tickets Dashboard button routing now resolves consistently from authenticated user role (`cashier`, `account`, `manager`, `admin`, `super_admin`) via shared auth role lookup.
- Bill History dashboard navigation logic now uses role-based routing instead of a hardcoded `/dashboard` target.
- Support Tickets hero action block layout was rebalanced so the Daily queue note and action buttons align more cleanly on medium and smaller widths.

### Removed
- Dashboard button was removed from the Bill History cashier header action strip to simplify report-screen controls.

### Fixed
- Support Tickets card visibility and contrast issues on cashier dashboard were corrected.
- Support Tickets now supports cashier layout mode without the left sidebar when opened by cashier role.
- POS add-item flow no longer forces viewport auto-scroll when refocusing Quick Add inputs.
- KOT success flow now clears cart counters and related quick-add/cart state consistently after print completion.
- KOT print feedback now shows a single consolidated toast (one success or one error) instead of duplicate stacked messages.
- Resolved incorrect dashboard redirection cases caused by incomplete role mapping in dashboard button handlers.
- Changelog page parsing now ignores markdown header/separator noise before rendering version sections.
- Changelog page changelog fetch now uses cache-busting query params to reduce stale release-note rendering.

---

## [2.0.8] - 2026-04-12

### Added
- Support Tickets hero now includes a role-aware Dashboard button that routes users to their correct dashboard (`cashier`, `account`, `manager`, or default).
- POS item cards now show an added-quantity counter badge at the top-right corner and display weight-based quantities in grams.

### Changed
- Cashier dashboard was simplified into a cleaner quick-action surface with reduced noise, tighter copy, and clearer visual hierarchy.
- Cashier dashboard responsive behavior was improved with fluid spacing and adaptive card reflow across desktop, tablet, and small mobile screens.
- POS item image frames were rebuilt to remove variable top/bottom whitespace by using a consistent square media area.
- POS item card typography and spacing were tuned so single-line item names no longer leave large gaps before the price button.
- POS mobile order summary now stacks better and keeps Quick Add pinned at the top while cart lines scroll underneath.
- Support Tickets hero action layout was refined so the Daily queue note and action buttons align cleanly on medium and small screens.

### Fixed
- Support Tickets now hides the left sidebar when the logged-in role is `cashier`.
- POS item-card quantity badge color was updated to red for clearer visibility.
- POS item add flow no longer auto-scrolls the viewport to Quick Add/cart when the item-code input is re-focused.
- Cart clear behavior after KOT was centralized so cart state, totals, quick-add fields, and item counters all reset consistently.
- KOT print notifications were consolidated to a single flow toast: one success toast on completion or one error toast on failure.
- Duplicate KOT notifications from mixed toast/message channels were removed to prevent stacked alert spam.

---


## [2.0.7] - 2026-04-11

### Added
- New shop-facing Support Tickets workspace with ticket list, unresolved-first filtering, ticket creation, ticket detail drawer, and customer comment timeline.
- New Support navigation entry and role access wiring so support tickets are reachable from menus, dashboards, and protected routes.

### Changed
- Support Tickets page hero card was reduced in visual size with tighter spacing, smaller chips, slimmer metrics, and a more compact action area.
- Support Tickets header styling was polished to feel sleeker while keeping the same content and mobile responsiveness.
- Super Admin support management now includes assignee loading, progress stage editing, richer ticket detail timestamps, and a close-ticket shortcut.
- POS top layout was simplified so the category bar now sticks flush to the top of the page and includes the dashboard, table, and customer-display actions in the same strip.
- POS category navigation now uses a full-width horizontal scroller for better space usage across narrow and wide screens.
- Soft POS item cards now use tighter content spacing so item names and prices sit closer together.
- Soft POS item names now reserve less vertical space, which makes the item grid denser without changing the two-line clamp behavior.
- POS quick add controls now stretch cleanly across the available card width.
- Local production builds now run through a wrapper script that ignores inherited local `CI` flags while preserving managed CI environments.

### Removed
- POS title banner, floating top action buttons, item context header chips, and the tap-to-add helper text were removed to free vertical space and reduce clutter.

### Build
- Production builds now disable source map generation through `.env.production` to keep output lighter for packaged releases.

---


## [2.0.6] - 2026-04-10

### Changed
- POS top layout was simplified so the category bar now sticks flush to the top of the page and includes the main action icons in the same horizontal strip.
- POS category navigation was converted into a full-width horizontal scroller for better use on smaller screens and wider menus.
- POS top action buttons now use darker backgrounds and align inline with the sticky category bar instead of floating separately.
- POS buttons across the page now use square corners for a sharper, more consistent control style.
- POS quick add section now fills the available width of the order summary card more cleanly.

### Removed
- POS title card/header section was removed from the top of the page to free vertical space for ordering actions.
- POS item panel context header details such as "Now showing", item count, selected table chip, and the tap-to-add helper text were removed to reduce visual clutter.

---

## [2.0.5] - 2026-04-06

### Added
- POS header now shows the current frontend version at the top of the screen.
- New soft-styled table selection modal with clearer available/occupied states and selection feedback.
- New cashier dashboard stylesheet and refreshed visual layout for main cashier actions.

### Changed
- POS screen was redesigned with a softer color palette, calmer floating controls, clearer content panels, and a less harsh bottom action bar.
- POS item cards were rebuilt into larger full-card touch targets with clearer price pills and easier tap-to-add behavior.
- POS item area now shows active category, subcategory, item count, and selected table context in a compact header.
- Quick Add and cart rows in POS were restyled for better readability during fast cashier use.
- Check Bill modal tables area was redesigned with richer status cards, clearer merge/split actions, and a more touch-friendly layout.
- Changelog page was restyled into a softer card-based layout and now includes a dashboard return button.
- Cashier dashboard was redesigned with clearer action cards, release version display, and improved mobile-friendly hierarchy.

### Fixed
- Changelog route now renders without the main layout wrapper so the page opens in its dedicated full-page design.
- Shared authenticated access was added for `/changelog`, so authenticated users can open release notes regardless of role-specific route lists.
- ESC/POS print services now use `REACT_APP_LOCAL_PRINT_AGENT_URL` consistently instead of hardcoded local ports.
- Local print agent requests now use shorter timeouts and clearer connection error messages when the print agent is unavailable.
- Debug logging in `updateData.js` was commented out to reduce noisy console output during normal POS use.
- Analytics `top-products` now tolerates older and newer `order_items` schemas by resolving live sales data without assuming `shop_id`, `bill_id`, `item_id`, or `price` columns always exist.
- Analytics `category-distribution` now classifies categories from available `order_items` fields and avoids hard failures when production data is missing optional joins or grouping columns.
- Backend analytics queries now scope `order_items` to `final_bill` through adaptive bill matching so production returns live results instead of 500 errors across mixed database variants.

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
