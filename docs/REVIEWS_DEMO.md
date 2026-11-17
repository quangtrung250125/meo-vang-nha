# Reviews after checkout

Local preview: http://127.0.0.1:5174/review-demo (development builds only).

- Customer: use the notification bell or the review button on a completed booking.
- Submit 1–5 stars, optional tags and up to 1000 characters; public display requires opt-in.
- One review per booking; edits are allowed for seven days from the first submission and revoke previous publication approval.
- Admin: the preview toolbar opens the real review management page with isolated sample data. Reply, approve or unpublish; customer and admin tabs sync through a dedicated preview storage key.
- Homepage: only consented, approved reviews appear; names are abbreviated and customer IDs and booking codes are not exposed.
- The preview reset buttons affect only sample reviews and bookings, never the actual customer session or booking storage.

## Production prerequisites

Apply supabase/migrations/20261117_create_booking_reviews.sql and configure SUPABASE_SERVICE_ROLE_KEY on the server. Neither has been changed by this task. Browser clients have no direct access to the review table. The API verifies the signed-in booking owner and completed booking status before accepting a review, and admin identity before moderation. No fake success or in-memory fallback is used for real review submissions.

Web push also needs the existing VAPID configuration and a subscribed customer device. Local UI tests stub all API requests and do not verify live push delivery.

## Checks

- npm run build
- node node_modules/vitest/vitest.mjs run tests/unit/reviewsService.test.js
- node scripts/verify-review-demo.cjs (start Vite on port 5174 first; Chrome installed)
