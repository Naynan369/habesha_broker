# Habesha Brokers

A Next.js marketplace for homes, vehicles, and commercial spaces across Ethiopia. PostgreSQL is accessed through Prisma; Iron Session manages signed-in sessions.

## Local setup

1. Install dependencies with `yarn install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you control.
3. Generate the Prisma client with `yarn prisma generate`.
4. Apply the checked-in database migration with `yarn prisma migrate deploy`.
5. Start the application with `yarn dev`.

The PostgreSQL URL has the form `postgresql://USER:PASSWORD@HOST:5432/habesha_brokers?schema=public`. `COOKIE_PASSWORD` must be a random string of at least 32 characters. `MYEMAIL` and `MYPASS` are the Gmail sender address and app password used for verification and password reset. `DOMAIN` is the public site origin, including its scheme.

The application now targets PostgreSQL. Existing data in a MongoDB Atlas cluster is not deleted or copied by this change; it needs a separate, deliberate data migration before the PostgreSQL database can contain those accounts and listings.

## Workflows

- Visitors browse approved home, vehicle, and business-space listings and can open a listing to view seller contact methods.
- Registration requires accepting the terms and uses a hashed password. Signing in establishes an HTTP-only, same-site session cookie.
- Signed-in users can request an email verification code. Verified users can submit listings; new and edited listings return to pending review.
- Commercial listings cover shops, offices, warehouses, market stalls, workshops, and land. They capture ETB pricing, rent or sale, floor area, Ethiopian location details, and practical facility availability.
- Users can save approved listings, manage their own profile and contact methods, and see recent listing activity.
- Administrators can review pending listings and approve or decline them.

API routes live under `pages/api`. The catch-all JSON route implements account, listing, save, contact, activity, and admin operations. Multipart listing and profile uploads have dedicated routes. `/api` is a small health endpoint.

## Uploaded images

The upload handlers save images under `public/items` and `public/profile`. This requires a persistent writable application filesystem. A serverless deployment needs durable object storage and a corresponding image-serving URL before uploads can be relied on in production.
