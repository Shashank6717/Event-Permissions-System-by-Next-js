

## Overview

The Event Permission System is a full-stack web application designed to digitalize and automate the college event permission workflow. It provides a structured, role-based interface for students to submit event permission requests and for faculty/HODs to review, recommend, approve, or reject those requests.

This README documents the application architecture, data model, user journeys, file structure, Supabase integration, security controls, and deployment process in exhaustive detail.

## Table of Contents

1. [Project Summary](#project-summary)
2. [Goals and Scope](#goals-and-scope)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)
5. [User Roles and Permissions](#user-roles-and-permissions)
6. [Detailed User Flow](#detailed-user-flow)
7. [Data Model and Supabase Schema](#data-model-and-supabase-schema)
8. [Application Structure](#application-structure)
9. [API and Integrations](#api-and-integrations)
10. [Security and Validation](#security-and-validation)
11. [Setup and Deployment](#setup-and-deployment)
12. [Developer Notes and Extension Points](#developer-notes-and-extension-points)
13. [Appendix](#appendix)

## Project Summary

The Event Permission System removes manual paperwork from the student event permission lifecycle. It supports:

- student registration and login with university email validation,
- event request submission with proof documents and letters,
- department-aware request routing,
- faculty recommendation workflow,
- HOD approval/rejection workflow with response messaging,
- request tracking through dashboards,
- history auditing for processed requests.

The application is implemented using Next.js App Router with Supabase for authentication, database, and file storage.

## Goals and Scope

### Primary Goals

- Provide students with a seamless way to submit event permission requests.
- Allow faculty and HODs to review those requests in a department-specific queue.
- Ensure requests are processed transparently and securely.
- Enable email notifications to students after request decisions.

### Scope

The system is intentionally built for a single college domain and uses role-based access to separate student and faculty/HOD experiences. It focuses on event permission request processing rather than broad campus administration.

## Architecture Overview

### High-Level Architecture

- **Frontend / UI**: Next.js pages and client components provide an interactive experience.
- **Backend / Server**: Next.js server components manage Supabase session checks and data fetching.
- **Database**: Supabase PostgreSQL stores user profiles and permission requests.
- **Storage**: Supabase storage bucket handles file uploads for proof and letters.
- **Email**: A Next.js API route sends status update emails through Mailgun.

### Workflow Layers

1. User authentication via Supabase Auth.
2. Profile creation in the `users` table.
3. Student request creation in the `permission_requests` table.
4. Faculty recommendation capture and HOD response updates.
5. Audit/history retrieval for both students and faculty.

## Technology Stack

- `Next.js 15` with App Router
- `TypeScript`
- `Tailwind CSS` and Shadcn UI primitives
- `Supabase` for auth, database, and storage
- `@supabase/auth-helpers-nextjs` for session handling
- `Mailgun` for outbound email notifications
- `framer-motion` for animated form transitions
- `lucide-react` for iconography
- `bcrypt`, `next-auth`, `prisma` appear in dependencies but the current app uses Supabase Auth and does not rely on Prisma at runtime.

## User Roles and Permissions

The application defines three user roles in `types/index.ts` and the database:

- `student`
- `faculty`
- `hod`

### Role responsibilities

- **Student**:
  - register with `@vnrvjiet.in` email
  - submit new permission requests
  - attach proof and request letter files
  - view request status and decision messages
  - review request history

- **Faculty**:
  - view pending department requests
  - provide recommendations for requests
  - cannot directly approve or reject a request

- **HOD**:
  - view pending department requests
  - approve or reject requests
  - send response messages to students

## Detailed User Flow

### 1. Entry and Landing Experience

The root route is implemented in `app/page.tsx`.

- A server component checks for an existing Supabase session.
- If the user is authenticated, it reads the `role` from the `users` table.
- Students are redirected to `/student/dashboard`.
- Faculty and HOD users are redirected to `/faculty/dashboard`.
- Unauthenticated users see the landing page content in `components/landing-page-client.tsx`.

### 2. Authentication and Registration

Authentication is handled by `components/auth/auth-form.tsx`.

#### Registration flow (`type="register"`)

- Users enter:
  - full name
  - university email
  - password
  - role (`student`, `faculty`, or `hod`)
  - department (for faculty/HOD)
  - roll number (for students)
- The form enforces `@vnrvjiet.in` email registration.
- After Supabase `auth.signUp`, a profile row is inserted into the `users` table with the selected role and supplemental metadata.
- On success, the user is redirected to `/login`.

#### Login flow (`type="login"`)

- Users sign in with email and password.
- After successful Supabase authentication, the app fetches the `role` from `users`.
- The user is routed to the correct dashboard based on role.

### 3. Student Dashboard and Request Submission

The student dashboard is implemented in `app/student/dashboard/page.tsx` and rendered via `components/dashboard/StudentDashboardClient.tsx`.

#### Student dashboard

- Fetches the authenticated student session.
- Counts requests grouped by status:
  - pending
  - approved
  - rejected
- Loads the latest 5 student requests.
- Displays these metrics and request summary cards.

#### Creating a new permission request

The new request form lives at `app/student/new-request/page.tsx`.

Input fields:

- event name
- event date
- event location
- target department for approval
- reason to attend
- detailed description
- proof file upload
- request letter file upload

Request submission flow:

1. The client component uses `supabase.auth.getUser()` to get the logged-in student.
2. It loads student metadata from `users`.
3. It uploads files into the Supabase storage bucket `documents` under the path `user.id/proofs/...` and `user.id/letters/...`.
4. It generates public URLs from `getPublicUrl` for both support documents.
5. It inserts a new row into `permission_requests` with:
   - `student_id`
   - `student_name`
   - `student_roll_number`
   - event details
   - file URLs
   - `status = pending`
   - `department_id`
6. The student is redirected to `/student/my-requests`.

#### Student request list

`app/student/my-requests/page.tsx` shows all requests made by the authenticated student.

For each request, it displays:

- event name
- event date
- department
- current status
- response message from HOD
- links to view proof and letter documents

The list is ordered by creation time descending.

### 4. Faculty Dashboard and Request Review

The faculty dashboard is implemented in `app/faculty/dashboard/page.tsx` and rendered by `components/dashboard/FacultyDashboardClient.tsx`.

#### Faculty/HOD dashboard

- Fetches the authenticated user session.
- Retrieves the user's department.
- Counts request totals for that department:
  - pending
  - approved
  - rejected
  - student count
- Loads the most recent pending requests, including any faculty recommendation metadata.

#### Pending request table

The pending requests list is rendered in `app/faculty/requests/page.tsx`.

Each row includes:

- student name and roll number
- event name
- event date
- request reason
- whether the request is backed by a faculty recommendation
- requested on date
- action button to view full details

This page ensures faculty and HOD only see requests for their own department.

### 5. Faculty Recommendation Workflow

Detailed request handling occurs in `app/faculty/requests/[id]/page.tsx`.

#### Faculty recommendation path

- When a faculty user opens a pending request, the page loads request details from `permission_requests`.
- It also resolves `faculty_recommender` via a Supabase join with `users`.
- Faculty can add a recommendation message if the request has not already been recommended.
- The page performs state validation to ensure:
  - the request is still `pending`
  - the request has not already been recommended
- The recommendation updates the request row with:
  - `faculty_recommendation`
  - `faculty_recommended_by`
  - `faculty_recommended_at`

Once recommended, the request remains pending for HOD review but is marked as faculty-backed.

### 6. HOD Approval and Rejection Workflow

The same request detail page supports HOD responses.

When the authenticated user has role `hod`, the UI presents:

- response text area
- `Reject` button
- `Approve` button

On submit, the page updates the request with:

- `status = approved` or `status = rejected`
- `response_message`
- `responded_at`
- `responded_by`

After the HOD decision, the page sends an email notification to the student.

### 7. Request History and Audit

Faculty and HOD users can review processed requests in `app/faculty/history/page.tsx`.

This page lists requests where `status != pending`, ordered by `responded_at` descending. Requests display:

- student information
- event name and date
- final status
- responded on date
- link to detailed view

## Data Model and Supabase Schema

The data model is defined conceptually in `lib/supabase-schema.ts` and realized in Supabase.

### `users` table

Columns:

- `id` (uuid, primary key from Supabase Auth)
- `email` (text, unique)
- `role` (text enum: `student`, `faculty`, `hod`)
- `name` (text)
- `roll_number` (text, nullable)
- `department` (text, nullable)
- `created_at` (timestamp with time zone, default `now()`)

### `permission_requests` table

Columns:

- `id` (uuid, primary key)
- `student_id` (uuid, foreign key to `users.id`)
- `student_name` (text)
- `student_roll_number` (text)
- `event_name` (text)
- `event_date` (date)
- `event_location` (text)
- `reason` (text)
- `description` (text)
- `proof_url` (text)
- `letter_url` (text)
- `status` (text enum: `pending`, `approved`, `rejected`, default `pending`)
- `created_at` (timestamp with time zone, default `now()`)
- `department_id` (text)
- `response_message` (text, nullable)
- `responded_at` (timestamp with time zone, nullable)
- `responded_by` (uuid, references `users.id`, nullable)
- `faculty_recommendation` (text, nullable)
- `faculty_recommended_by` (uuid, references `users.id`, nullable)
- `faculty_recommended_at` (timestamp with time zone, nullable)

### Storage bucket

- Bucket name: `documents`
- Purpose: store student proof documents and request letters
- Storage path convention:
  - `${user.id}/proofs/...`
  - `${user.id}/letters/...`

### Supabase row-level security policies

`lib/supabase-schema.ts` includes example policies for:

- allowing users to read and update their own `users` row
- allowing students to insert permission requests and view only their own requests
- allowing faculty and HOD to read department-specific requests
- allowing faculty to recommend pending requests for their department
- allowing HOD to update department-specific requests
- allowing storage object access to authorized users

These policies are critical for maintaining data isolation and ensuring that only the correct users and departments can read or modify sensitive records.

## Application Structure

### Key directories

- `app/`
  - `page.tsx` — root landing and authentication redirect logic
  - `faculty/` — faculty and HOD experience
    - `dashboard/page.tsx`
    - `requests/page.tsx`
    - `requests/[id]/page.tsx`
    - `history/page.tsx`
  - `student/` — student experience
    - `dashboard/page.tsx`
    - `my-requests/page.tsx`
    - `new-request/page.tsx`
  - `api/send-email/route.ts` — email notification API
- `components/`
  - `auth/auth-form.tsx` — login/register UI and auth logic
  - `dashboard/` — dashboard client components
  - `ui/` — shared design system primitives
  - `landing-page-client.tsx` — public marketing/entry page UI
- `lib/`
  - `supabase.ts` — Supabase client wrapper
  - `supabase-schema.ts` — reference schema and policies
- `types/`
  - `index.ts` — shared TypeScript enums and interfaces
  - `supabase.ts` — typed database schema definitions

### UI and Rendering Model

The app uses a mixed server/client model:

- Server components are used for data fetching and session-aware page rendering.
- Client components are used for interactive forms and file upload workflows.

Examples:

- `app/student/dashboard/page.tsx` uses a server component for session retrieval and data aggregation.
- `components/auth/auth-form.tsx` is a client component that manages form state and performs Supabase auth operations.
- `app/faculty/requests/[id]/page.tsx` is a client component because it requires user-driven state updates and user interaction.

### Navigation and routes

The app exposes these primary routes:

- `/` — landing page and auth redirect
- `/login` — login form
- `/register` — registration form
- `/student/dashboard` — student dashboard
- `/student/my-requests` — student request history and status
- `/student/new-request` — student request creation form
- `/faculty/dashboard` — faculty/HOD summary dashboard
- `/faculty/requests` — pending department requests
- `/faculty/requests/[id]` — detailed request review
- `/faculty/history` — processed request history
- `/api/send-email` — server-side email notification endpoint

## API and Integrations

### Supabase Client

`lib/supabase.ts` creates a Supabase client instance:

```ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

const supabase = createClientComponentClient<Database>();
export default supabase;
```

This client is used inside client components for authenticated operations like file upload, user metadata reads, and request creation.

### Email Notification API

`app/api/send-email/route.ts` implements a POST endpoint that uses Mailgun to send emails.

The endpoint expects JSON with:

- `to`
- `subject`
- `text`

When a HOD approves or rejects a request, the `faculty/requests/[id]/page.tsx` route calls this API to notify the student.

### Mailgun integration notes

The current implementation hard-codes a sandbox Mailgun domain and API key in source code. For production, these credentials must be moved to environment variables and the `from` address should be configured to a verified domain.

## Security and Validation

### Authentication and role enforcement

The application relies on Supabase Auth for session management. Registration is constrained to `@vnrvjiet.in` emails in the client form.

Server-side role enforcement is performed through:

- session checks in server components
- department-based filtering in Supabase queries
- explicit authorization checks in client pages before allowing actions

### Row-level security (RLS)

Supabase RLS policies are necessary for protecting data at the database layer. The schema file provides policies for:

- user self-access
- student-only request creation and selection
- department-limited faculty/HOD access
- faculty recommendation restrictions

### File upload security

File uploads are saved to the Supabase `documents` bucket under per-user folders. The app obtains public URLs for uploaded files.

The schema references policies that should restrict file upload and access to authorized users only.

### Input validation

The client forms validate required fields and enforce expected values:

- email domain validation during registration
- required request fields in the new request form
- recommendation input before submitting faculty recommendation
- response message capture when HOD approves or rejects a request

### Potential improvements

The current application can be hardened by adding:

- server-side validation for all inputs
- stricter file type and size checks for uploads
- stronger session expiration handling
- CSRF protections for API calls
- email validation and sender verification in Mailgun

## Setup and Deployment

### Prerequisites

- Node.js 18 or newer
- npm or yarn
- Supabase project
- Mailgun account or equivalent email provider

### Local environment variables

The application expects the following environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Add Mailgun configuration through environment variables if refactoring the email route.

### Installing dependencies

```bash
npm install
# or
yarn install
```

### Running locally

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000`.

### Supabase configuration steps

1. Create a new Supabase project.
2. Configure Auth with email/password.
3. Create the `users` and `permission_requests` tables.
4. Create a `documents` storage bucket.
5. Apply row-level security policies from `lib/supabase-schema.ts`.
6. Set the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

### Production deployment

The app is deployable to Vercel or any platform that supports Next.js App Router.

For Vercel:

1. Connect the Git repository.
2. Set environment variables in the Vercel dashboard.
3. Deploy.

### Runtime commands

- `npm run dev` — start development server
- `npm run build` — build production site
- `npm run start` — start built production server
- `npm run lint` — lint the project

## Developer Notes and Extension Points

### Extending the workflow

The app is designed to support future enhancements such as:

- student request editing before review
- multi-step approvals with faculty/HOD parallel review
- email templates and notification preferences
- digital signatures and approval PDFs
- role-based admin management

### Important implementation details

- `app/page.tsx` performs user role redirect logic before rendering the public landing page.
- `components/auth/auth-form.tsx` is the single source of truth for both login and registration flows.
- `app/student/new-request/page.tsx` is the only route currently responsible for request creation.
- `app/faculty/requests/[id]/page.tsx` contains both faculty recommendation and HOD response workflows.

### Known codebase caveats

- The Mailgun API key is currently included directly in code inside `app/api/send-email/route.ts`. This should be moved to secrets.
- The database schema reference exists in `lib/supabase-schema.ts` but the actual table definitions are not enforced in code.
- Both Supabase and client-side role enforcement are used; proper RLS is required for security.

## Appendix

### Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database schema reference

`users` table:

- `id`, `email`, `role`, `name`, `roll_number`, `department`, `created_at`

`permission_requests` table:

- `id`, `student_id`, `student_name`, `student_roll_number`, `event_name`, `event_date`, `event_location`, `reason`, `description`, `proof_url`, `letter_url`, `status`, `created_at`, `department_id`, `response_message`, `responded_at`, `responded_by`, `faculty_recommendation`, `faculty_recommended_by`, `faculty_recommended_at`

### Supabase policies (reference)

The following example policies should be enabled when deploying the database:

- Users can view and update their own profile
- Students can create requests only for themselves
- Students can view only their own requests
- Faculty/HOD can view requests only for their department
- Faculty can attach a recommendation only once to pending requests
- HOD can update the status of department requests

### Recommended improvements for production

- secure Mailgun configuration
- set up email verification for registered users
- add a `notifications` table for audit logs
- implement pagination for large tables
- add robust server-side validation and sanitization

---

This documentation is intended to support both technical evaluation and a comprehensive project report. It covers the application end-to-end from user journeys and architecture to data modeling and deployment.
