# Staff Data Workplace Hub

This branch upgrades the Staff Data Management System into a workplace collaboration hub.

## Included
- Existing staff directory data
- Supabase Auth login
- Staff dashboard
- Real-time direct chat
- Teams and departments
- Company announcements
- Tasks
- Calendar and meetings
- Attendance check-in/out
- Approval workflow
- Document upload/storage
- Notifications
- Responsive workplace UI

## Setup

1. Create/open your Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/workplace_schema.sql`.
4. In Supabase Authentication, create the first user with email/password.
5. Run the final SQL comment from the schema with that user's UUID:
   `update public.profiles set role='owner' where id='YOUR_AUTH_USER_UUID';`
6. Ensure your Vercel/local environment has:
   `VITE_SUPABASE_URL`
   and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. Install and run:
   `npm install`
   `npm run dev`

## Important
The old implementation remains in `src/adminapp.tsx`. The new `src/WorkplaceApp.tsx` is now the application entry point on this branch.

The new SQL intentionally keeps the existing `staff`, `leave_requests`, `activity_log`, and `admins` tables intact. It adds the collaboration tables around them.

## Branch
workplace-hub-v3
