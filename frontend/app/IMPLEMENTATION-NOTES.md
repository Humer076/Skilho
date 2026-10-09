# Skilho frontend update notes

- Added a highlighted Advertise With Us link to the homepage navigation.
- Added responsive header, logo sizing, mobile overflow and reduced-motion CSS.
- Added role-aware chatbot UX: technician job/location guidance, employer candidate matching, admin document/package workflow, general public help.
- Chatbot calls the backend `/chatbot/answer` endpoint when configured, and falls back to local role-specific FAQs if the API key is absent or the backend is unavailable.
- Forgot-password UI now requests a six-digit OTP and accepts the OTP plus a new password. Backend currently limits OTP requests to three per account per UTC day and expires OTPs after two minutes.
- Removed technician verification controls from the admin technician directory; it remains a directory/metrics page.
- Added package purchase/subscription history to Admin → Packages. Demo activation records are explicitly labelled as not verified real payments.

## Important limitation
This uploaded frontend ZIP is a source-only bundle, not a full Next.js project. The original root `package.json`, lockfile, TypeScript/Next configuration, public logo assets, and other root files were not included. Merge these source files into the complete project and run its normal lint/build/test commands before deploying.
