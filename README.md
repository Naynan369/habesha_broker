# Habesha Brokers

A Next.js marketplace for housing and car listings. The application uses MongoDB through Prisma and Iron Session cookies for authentication.

## Local setup

1. Install dependencies with npm install.
2. Copy .env.example to .env and set the values.
3. Generate the Prisma client with npx prisma generate.
4. Confirm the existing MongoDB relation references use BSON ObjectIds before applying this schema to any database that already has data.
5. Start the application with npm run dev.

Existing databases may need a one-time conversion of relation ID fields to BSON ObjectIds; this code does not modify database contents. The COOKIE_PASSWORD must be a random string of at least 32 characters. MYEMAIL and MYPASS are the Gmail sender credentials used by verification and password reset. DOMAIN is the public site origin, including its scheme.

## Workflows

- Visitors browse only approved listings and can open a listing to view seller contact methods.
- Registration requires accepting the terms and uses a hashed password. Signing in establishes an HTTP-only, same-site session cookie.
- Signed-in users can request an email verification code. Verified users can submit car or house listings; new and edited listings return to pending review.
- Users can save approved listings, manage their own profile and contact methods, and see recent listing activity.
- Administrators can review pending listings and approve or decline them.

API routes live under pages/api. The catch-all JSON route implements account, listing, save, contact, activity, and admin operations. Multipart listing and profile uploads have dedicated routes. /api is a small health endpoint.

## Uploaded images

The upload handlers save images under public/items and public/profile. This requires a persistent writable application filesystem. A serverless deployment needs durable object storage and a corresponding image-serving URL before uploads can be relied on in production.

