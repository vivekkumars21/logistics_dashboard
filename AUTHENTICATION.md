# Authentication System & User Roles

## Overview
This supply chain management system uses a role-based authentication system with three user profiles: **Admin**, **User**, and **Viewer**.

## Database Setup

### Users Table
The system uses a `users` table in Supabase with the following structure:

```sql
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### How to Set Up
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute the SQL from `sql/users_table.sql`
4. The system will populate with 3 demo user accounts

## User Roles & Permissions

### 👤 Admin
- **Email:** admin@example.com
- **Password:** admin123
- **Permissions:**
  - ✅ View all records
  - ✅ Upload Excel files
  - ✅ Edit records (change dispatch remarks, status)
  - ✅ Delete records (with access to Edit Mode)
  - ✅ Access to admin controls

### 👥 User
- **Email:** user@example.com
- **Password:** user123
- **Permissions:**
  - ✅ View all records
  - ✅ Upload Excel files
  - ✅ Edit records (change dispatch remarks, status)
  - ❌ Delete records
  - ❌ Access to admin controls

### 👁️ Viewer
- **Email:** viewer@example.com
- **Password:** viewer123
- **Permissions:**
  - ✅ View all records (read-only)
  - ❌ Upload Excel files
  - ❌ Edit records
  - ❌ Delete records
  - ❌ Access to any management features

## Login Flow

1. User navigates to `/login` page
2. Enters credentials (email & password)
3. System validates against `users` table in database
4. On success, user data stored in localStorage and auth context
5. User redirected to dashboard
6. Features shown/hidden based on role

## API Endpoints

### POST `/api/auth/login`
Authenticates user and returns user data

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Auth Context & Storage

- User authentication state is managed via React Context
- User data persisted in browser localStorage
- Session maintained across page refreshes
- Logout clears localStorage and resets auth state
- Unauthenticated users redirected to `/login`

## Security Notes

⚠️ **For Production:**
- Replace hardcoded passwords with proper hashing (bcrypt)
- Implement JWT tokens for API authentication
- Set up HTTPS for all communications
- Use environment variables for sensitive data
- Add rate limiting to login attempts
- Implement password reset functionality
- Consider adding 2FA (Two-Factor Authentication)

## Files Modified

- `src/lib/auth-context.tsx` - Authentication context and hooks
- `src/app/login/page.tsx` - Login page UI
- `src/app/api/auth/login/route.ts` - Login API endpoint
- `src/app/root-layout-client.tsx` - Auth-aware layout wrapper
- `src/app/layout.tsx` - Main layout with AuthProvider
- `src/components/Navbar/Navbar.tsx` - Profile dropdown menu
- `src/app/page.tsx` - Dashboard with role-based features
- `sql/users_table.sql` - Database schema

## Testing

1. Login with Admin account → Full access
2. Login with User account → Upload & edit only
3. Login with Viewer account → View only
4. Logout → Redirected to login page
