# Fixes from latest user screenshots

- Homepage Find jobs navigation now opens `/jobs` rather than only scrolling to the landing-page section.
- Main hero CTA `Find your next job` now opens `/jobs` instead of sending a visitor to login first.
- Footer Find jobs link opens `/jobs`.
- Advertise With Us navigation styling is now a compact outlined pill rather than a large filled call-to-action.

## Signup OTP status
The frontend's current registration form calls `POST /auth/register`, and the supplied backend immediately creates a user. A real technician-only email OTP flow cannot be safely completed from the supplied source bundle alone because it does not include `prisma/schema.prisma` or migrations to persist pending signups and OTP attempt counters. Do not claim OTP enforcement is complete until the backend adds persistent pending-registration records, OTP verification endpoints, expiry, daily send limit, and failed-attempt lockout. Employer registration remains direct as requested.
