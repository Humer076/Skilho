# Skilho Mobile App Plan

## Goal

Add a mobile app for iOS and Android while keeping the existing Next.js website as the laptop and browser experience. The mobile app will have its own phone-friendly screens and will connect to the existing NestJS backend. The website and mobile app will use the same accounts, jobs, applications, and database.

## Current project

- `frontend/`: Next.js 16 and React 19 website.
- `backend/`: NestJS API with Prisma/database integration.
- Existing backend areas include authentication, jobs, public jobs, employee, employer, applications, documents, notifications, packages, and technicians.
- There is no separate iOS or Android app in the repository yet.

## Proposed project structure

```text
skilho/
├── backend/                 # Existing NestJS API and database access
├── frontend/                # Existing Next.js website; remains the web experience
└── mobile/                  # New Expo + React Native + TypeScript app
    ├── app/                  # Screens and navigation
    ├── components/           # Reusable mobile UI
    ├── features/             # Auth, jobs, applications, profile, etc.
    ├── services/             # API client and backend calls
    └── app.json              # iOS/Android app configuration
```

## What can be reused

- The existing NestJS API, Prisma models, database, and business rules.
- Existing authentication and job/application endpoints where they meet mobile needs.
- Product wording, colors, logo, and other brand assets.

The Next.js screens themselves cannot be used as native screens. Mobile screens need to be built in React Native, with layouts designed for touch and phone-sized displays. Some validation and data types could be shared later if moved into a common package, but this is optional for the first version.

## Suggested first mobile release

### Technician experience

- Sign in and account creation.
- Browse and search jobs; filter by category and location.
- View job details and apply.
- Save jobs and manage applications.
- View and edit profile, skills, and documents.
- View notifications.

### Employer experience

- Sign in.
- View employer dashboard and job postings.
- Create and manage job postings.
- Review applicants and update application status.
- View basic technician profiles where existing permissions allow it.

The exact employer features should be matched against existing API permissions before implementation.

## Implementation phases

1. **API and feature review:** Map each mobile screen to an existing endpoint, identify missing endpoints, and confirm role permissions.
2. **Mobile foundation:** Create the Expo app, configure TypeScript/navigation, add shared branding, and set up environment-specific API URLs.
3. **Technician MVP:** Build authentication, job search/details, apply/save, profile, applications, and notifications.
4. **Employer MVP:** Build employer job management and applicant review flows.
5. **Device readiness:** Handle loading, empty, offline, and error states; check accessibility and test common screen sizes on iOS and Android.
6. **Release preparation:** Configure app identifiers, icons, privacy information, signing, store listings, and release builds.

## Important technical choices

- Use Expo with React Native and TypeScript for one mobile codebase that can build for iOS and Android.
- Keep the web frontend separate; do not replace or redesign it as part of the mobile work.
- Keep API URLs in environment configuration. A phone cannot use `localhost` to reach a backend running on a developer's computer; development needs a LAN or hosted API address, and releases need a stable HTTPS API.
- Store authentication tokens in platform-secure storage, not ordinary web-style local storage.
- Keep role-based authorization enforced by the backend. Hiding a screen in the app is not a substitute for API authorization.
- Push notifications, in-app purchases, offline mode, and biometric login are optional follow-up features unless specifically included in the first release.

## Rough schedule

Assuming one developer working full-time, the existing backend is reachable, and the first release uses current features:

| Work | Rough estimate |
| --- | ---: |
| Endpoint and feature review | 2–4 working days |
| App foundation and authentication | 4–7 working days |
| Technician MVP | 2–3 weeks |
| Employer MVP | 1–2 weeks |
| Device testing, fixes, and release preparation | 1–2 weeks |
| **Total** | **About 5–9 weeks** |

This is a planning estimate, not a fixed delivery date. Missing API features, production database or hosting issues, payment/push-notification requirements, delays getting test devices, and store review can add time. App Store and Play Store accounts and approvals are separate from implementation time.

## Ready-to-start checklist

- Confirm which employer features are required in the first app release.
- Confirm the production API URL and that it is reachable over HTTPS.
- Decide the app name, package/bundle identifiers, icon, and splash screen.
- Arrange Apple Developer and Google Play developer accounts before store submission.
- Select a few supported iOS and Android devices or emulators for testing.
- Agree on a first-release feature list before implementation begins.

## Recommended release order

1. Keep the current website and backend running.
2. Build and test the technician mobile MVP.
3. Add the employer mobile workflows.
4. Release to a small test group before public store submission.
5. Publish iOS and Android builds after device testing and store review.
