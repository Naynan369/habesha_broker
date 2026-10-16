# Habesha Brokers

A Next.js marketplace for homes, vehicles, and commercial spaces across Ethiopia. PostgreSQL is accessed through Prisma; Iron Session manages signed-in sessions.

## Local setup

1. Install dependencies with `yarn install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you control.
3. Generate the Prisma client with `yarn prisma generate`.
4. Apply the checked-in database migration with `yarn prisma migrate deploy`.
5. Start the application with `yarn dev`.

The PostgreSQL URL has the form `postgresql://USER:PASSWORD@HOST:5432/habesha_brokers?schema=public`. `COOKIE_PASSWORD` must be a random string of at least 32 characters. `MYEMAIL` and `MYPASS` are the Gmail sender address and app password used for verification and password reset. `DOMAIN` is the public site origin, including its scheme. Connect a Vercel Blob store to the Vercel project; Vercel supplies `BLOB_READ_WRITE_TOKEN` to the environments selected for that connection. For local uploads, set a Blob read/write token in `.env` without committing it.

The application now targets PostgreSQL. Existing data in a MongoDB Atlas cluster is not deleted or copied by this change; it needs a separate, deliberate data migration before the PostgreSQL database can contain those accounts and listings.

## Workflows

- Visitors browse approved home, vehicle, and business-space listings and can open a listing to view seller contact methods.
- Registration requires accepting the terms and uses a hashed password. Signing in establishes an HTTP-only, same-site session cookie.
- Signed-in users can request an email verification code. Verified users can submit listings; new and edited listings return to pending review. Session cookies contain only the account ID and a database session version, so changing the password revokes other sessions.
- Commercial listings cover shops, offices, warehouses, market stalls, workshops, and land. They capture ETB pricing, rent or sale, floor area, Ethiopian location details, and practical facility availability.
- Users can save approved listings, manage their own profile and contact methods, and see recent listing activity.
- Administrators can review pending listings and approve or decline them.

API routes live under `pages/api`. The catch-all JSON route implements account, listing, save, contact, activity, and admin operations. `/api/blob/upload` authorizes browser-to-Blob uploads for listing photos, house videos, and profile photos. The listing API only accepts Blob URLs owned by the signed-in user. `/api` is a small health endpoint.

## Uploaded media

Images and optional home videos upload directly from the browser to Vercel Blob. They are stored independently of the application deployment, so listings keep working across serverless invocations and new deployments. The Vercel Blob store must be connected to the same Vercel project and to each environment where uploads are expected.

## Chapa payment testing

Use a Vercel Preview deployment for merchant testing. Set `CHAPA_SECRET_KEY` to the Chapa **test-mode** secret key in the Preview environment, and set `CHAPA_WEBHOOK_SECRET` to the matching test webhook secret. Keep the Production environment on live keys. Test-mode transactions do not charge real money. Set `LISTING_FEE_ETB` to the fee you want to test (currently `1000`).

In Chapa, configure the webhook URL to the Preview deployment's public origin plus `/api/payments/chapa/callback`. Set `DOMAIN` for the Preview environment to that same stable Preview origin so checkout return and callback URLs point to the test deployment; Production should use the production domain. If using a changing per-deployment Preview URL, update the Chapa webhook target to match it before testing. Apply database migrations to the PostgreSQL database used by that deployment before testing payments. The simulated payment endpoint is development-only and is not enabled on Vercel.
