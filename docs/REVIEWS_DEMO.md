# Reviews after checkout

Local preview: http://127.0.0.1:5174/review-demo (development builds only).

- Customer: use the notification bell or the review button on a completed booking.
- Submit 1–5 stars, optional tags and up to 1000 characters; public display requires opt-in.
- One review per booking; edits are allowed for seven days from the first submission and revoke previous publication approval.
- Admin: the preview toolbar opens the real review management page with isolated sample data. Reply, approve or unpublish; customer and admin tabs sync through a dedicated preview storage key.
- Homepage: only consented, approved reviews appear; names are abbreviated and customer IDs and booking codes are not exposed.
- The preview reset buttons affect only sample reviews and bookings, never the actual customer session or booking storage.

## Vercel Function routing

Review URLs remain /api/reviews/:action. Vercel rewrites them to the existing /api/bookings Function with a reviewAction query parameter. The private review handler remains in api/_lib; the project has 12 Functions and fits the Hobby limit. Local Vite supports both forms of the route.

## Production prerequisites

Apply supabase/migrations/20261117_create_booking_reviews.sql and configure SUPABASE_SERVICE_ROLE_KEY on the server. Neither has been changed by this task. Browser clients have no direct access to the review table. The API verifies the signed-in booking owner and completed booking status before accepting a review, and admin identity before moderation. No fake success or in-memory fallback is used for real review submissions.

Web push also needs the existing VAPID configuration and a subscribed customer device. Local UI tests stub all API requests and do not verify live push delivery.

## Checks

- npm run build
- node node_modules/vitest/vitest.mjs run tests/unit/reviewsService.test.js
- node scripts/verify-review-demo.cjs (start Vite on port 5174 first; Chrome installed)

## Complete admin workflow preview

Start npm run dev -- --host 127.0.0.1 --port 5173 and open http://127.0.0.1:5173/review-demo/admin.

The preview starts with eight reviews across six Vietnam calendar months: two unresolved low ratings, four replies and two approved public reviews. Use the toolbar button Nạp dữ liệu 6 tháng to restore this scenario. The customer preview is Nguyễn Thị Lan; use it to edit her recent review. Admin can reply, approve a third review to replace all homepage samples, or unpublish to restore sample fallback below the three-review threshold. Customer/admin tabs sync through a dedicated preview storage key.

Other routes:
- /review-demo/admin?tab=list
- /review-demo/admin?tab=urgent
- /review-demo/admin/overview
- /review-demo/admin/room-status
- /review-demo
- /review-demo/home#customer-reviews

Check with node scripts/verify-review-admin.cjs. The test intercepts external APIs and does not send real push or change production data.

In production, review writes still use booking_reviews and the existing service-role server configuration. No additional migration is needed for these changes. Same-browser tabs receive immediate BroadcastChannel invalidation; other devices use Supabase broadcast invalidation, with polling and focus refresh as fallbacks. Only an invalidation signal is broadcast, never review contents.

Checkout review invitations are emitted on the authenticated server after an accepted checkout, not independently from two frontend screens. Reply push is attempted after saving a changed response. Missing push configuration or an unsubscribed device does not undo a saved reply; the customer can still read it in their booking and notification bell. Real-device delivery must be checked with a subscribed device and working VAPID credentials.
