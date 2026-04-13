# Psychologists App

Modern web application for finding psychologists and booking consultations online.

## Features

- User registration and login
- Protected Favorites page
- Add / remove psychologists to favorites
- Psychologists catalog page
- Sorting by name, price, and rating
- Load more functionality
- Appointment booking modal
- Form validation
- Responsive design

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Firebase Authentication
- Firebase Realtime Database
- Zustand
- Formik + Yup
- CSS Modules

## Pages

- Home
- Psychologists
- Favorites (private)

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Purpose

Portfolio project focused on authentication, protected routes, state management, database integration, and modern frontend development.
