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

## Stripe test checkout

The listing publication fee is fixed at **€40 EUR**. Checkout uses Stripe test mode only and accepts a secret key beginning with `sk_test_` or a restricted test key beginning with `rk_test_`; live Stripe keys are rejected. A restricted key must have permission to create and retrieve Checkout Sessions. Set `STRIPE_SECRET_KEY` in `.env` for local development or in the Vercel environment you want to test, then restart the local server or redeploy. No webhook secret is needed for this return-based test flow. The server verifies the Stripe Checkout session, test mode, amount, currency, and payment status before marking the listing paid. The listing remains private until an admin approves it.

Checkout uses the payment methods enabled in your Stripe Dashboard for the account and EUR currency. Enable Cards in the Dashboard's test-mode payment-method settings to use Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any CVC. Stripe test mode does not charge real money. For Vercel, use a Preview deployment and add the test secret to the Preview environment. Apply the database migrations to the PostgreSQL database used by the deployment before testing checkout.

## Google and Apple sign-in

Add the public provider identifiers to your local `.env` and Vercel project environment variables:

- `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`: a Google OAuth 2.0 Web client ID. Add each site origin (for local development and production) to its authorized JavaScript origins.
- `NEXT_PUBLIC_APPLE_SERVICE_ID`: the Apple Services ID configured for web sign-in.
- `NEXT_PUBLIC_APPLE_REDIRECT_URI`: the exact HTTPS return URL registered for that Services ID. Apple web sign-in requires the website domain and return URL to be configured in Apple Developer; localhost is not a supported Apple web return URL.

Apply the new Prisma migration before using either provider. The sign-in buttons stay unavailable until their provider configuration is present. Provider identities are linked by their stable account ID; only verified provider emails are accepted.
