# Psychologists Services

Portfolio pet project that simulates a production-style platform for finding psychologists, saving favorites, booking consultations, leaving reviews, and managing the service through an admin panel.

## Highlights

- Public catalog with sorting and filters by name, price, and rating
- Authentication with Firebase Auth
- Protected favorites and profile pages
- Appointment booking with availability checks, closed days, closed time slots, and status tracking
- User profile with booking history and cancellation flow
- Review submission, moderation, deletion, and automatic rating recalculation
- Admin dashboard with booking pipeline, review queue, recent bookings, and core metrics
- Admin CRUD for psychologists
- Responsive UI for desktop and mobile
- Form validation, persisted drafts, loading states, empty states, and toast feedback

## User Roles

**Visitor**
- Browse psychologists
- Sort and filter the catalog
- Open specialist details and reviews

**Authenticated user**
- Save psychologists to favorites
- Book appointments
- Leave reviews for moderation
- Track and cancel appointments in the profile page

**Admin**
- Manage psychologists
- Confirm or cancel bookings
- Close days and specific time slots
- Approve, reject, or delete reviews
- Monitor platform activity from the dashboard

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Firebase Authentication
- Firebase Realtime Database
- Zustand
- Formik + Yup
- CSS Modules
- Vitest

## Core Pages

- `/` - landing page
- `/psychologists` - catalog
- `/favorites` - protected saved specialists
- `/profile` - protected booking history
- `/admin` - dashboard
- `/admin/psychologists` - specialist management
- `/admin/bookings` - booking and availability management
- `/admin/reviews` - review moderation

## Demo Access

Demo accounts can be created in Firebase Authentication and assigned roles through the Realtime Database.

For public deployment, use restricted demo accounts and never expose real production credentials in the repository.

To enable admin access:

1. Create a demo user in Firebase Authentication.
2. Copy the generated user `uid`.
3. Add the matching user record in Firebase Realtime Database:

```json
{
  "users": {
    "PASTE_ADMIN_UID_HERE": {
      "name": "Demo Admin",
      "email": "demo-admin@example.com",
      "role": "admin"
    }
  }
}
```

Regular users should have `role: "user"` or no admin role.

## Product Details

The app is built around a realistic marketplace workflow:

1. Users browse specialists and compare rating, price, experience, and reviews.
2. Authenticated users book a time slot through a modal with validation and availability checks.
3. Bookings are stored with `pending`, `confirmed`, or `cancelled` statuses.
4. Admins manage booking status and can close unavailable days or time slots.
5. Reviews are moderated before appearing publicly and ratings are recalculated from non-rejected reviews.

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Quality Checks

```bash
npm run lint
npm run build
npm test
```

## Portfolio Focus

This project is designed to demonstrate:

- role-based application flows;
- Firebase data modeling and Realtime Database operations;
- protected client routes;
- admin workflows;
- state persistence with Zustand;
- form handling and validation;
- responsive product UI;
- production-minded edge cases such as empty states, cancellation, moderation, and rating recalculation.
