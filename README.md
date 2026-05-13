# Psychologists Services

Full-featured portfolio project for finding psychologists, saving favorites, booking consultations, leaving reviews, and managing the platform through an admin panel.

## Highlights

- Responsive public catalog with filtering and sorting by name, price, and rating
- Firebase Authentication with protected user and admin routes
- Favorites, profile page, and personal appointment history
- Appointment booking with busy-slot checks, closed days, closed time slots, and past-time prevention
- User profile photo upload/removal through Cloudinary
- Review submission, moderation, deletion, and automatic psychologist rating recalculation
- Admin dashboard with booking pipeline, review queue, upcoming appointments, past bookings, incomplete profiles, and recent activity
- Admin CRUD for psychologists with Cloudinary image upload and profile completeness filters
- Booking management with status changes, availability controls, past booking markers, and delete confirmation
- Responsive admin UI for desktop and mobile
- Form validation, persisted drafts, loading states, empty states, and toast feedback

## User Roles

**Visitor**
- Browse psychologists
- Sort and filter the catalog
- Open specialist cards and reviews

**Authenticated user**
- Save psychologists to favorites
- Book available appointment slots
- Leave reviews for moderation
- Track appointment history in profile
- Cancel active appointments
- Upload or remove profile photo

**Admin**
- Manage psychologist profiles and photos
- Search, sort, and filter psychologist records
- Confirm, cancel, or delete bookings
- View past bookings and client details
- Close full days or individual time slots
- Approve, reject, or delete reviews
- Monitor platform health from the dashboard

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Firebase Authentication
- Firebase Realtime Database
- Cloudinary unsigned uploads
- Zustand
- Formik + Yup
- CSS Modules
- Vitest

## Core Pages

- `/` - landing page
- `/psychologists` - public catalog
- `/favorites` - protected saved specialists
- `/profile` - protected profile, avatar, and appointment history
- `/admin` - dashboard
- `/admin/psychologists` - specialist management
- `/admin/bookings` - booking and availability management
- `/admin/reviews` - review moderation

## Product Workflow

1. Users browse specialists and compare rating, price, experience, specialization, and reviews.
2. Authenticated users book an available time slot through a validated modal.
3. Booking checks prevent cancelled, closed, busy, and past slots from being selected.
4. Bookings are stored with `pending`, `confirmed`, or `cancelled` statuses.
5. Admins manage statuses, delete old bookings, and control availability by day or time slot.
6. Users leave reviews, admins moderate them, and ratings are recalculated from non-rejected reviews.
7. Users and psychologists can have uploaded photos stored in Cloudinary and referenced from Firebase.

## Admin Access

Create a user in Firebase Authentication, copy the `uid`, then add a user record in Firebase Realtime Database:

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

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
NEXT_PUBLIC_CLOUDINARY_FOLDER=psychologists
```

Cloudinary uses unsigned uploads from the client. Do not expose `API Secret` in the frontend.

## Quality Checks

```bash
npm run lint
npm run build
npm test
```

## Portfolio Focus

This project demonstrates:

- role-based app flows;
- Firebase Auth and Realtime Database operations;
- protected client routes;
- Cloudinary media uploads;
- admin workflows and operational dashboards;
- persisted form drafts with Zustand;
- robust form handling and validation;
- responsive product UI;
- realistic edge cases such as past slots, moderation, cancellation, deletion, empty states, and rating recalculation.
