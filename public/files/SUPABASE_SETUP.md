# Supabase Setup Guide for Service Hub Pro

## Prerequisites
- Supabase account (free tier available at https://supabase.com)
- Node.js 16+ installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Sign In" (or create an account if needed)
3. Click "New project"
4. Fill in the project details:
   - **Name**: Service Hub Pro
   - **Database Password**: Create a strong password (you'll need it for backups)
   - **Region**: Choose closest to your location
5. Click "Create new project" and wait for initialization

## Step 2: Get Your API Keys

1. Once the project is created, go to **Settings** (bottom left)
2. Click on **API** in the left sidebar
3. You'll see:
   - **Project URL** (copy this)
   - **Anon Key** (copy this - it's under the Project URL)

## Step 3: Set Up Environment Variables

1. In the project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your values:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Step 4: Create Database Tables

1. In Supabase, go to the **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy all SQL from `DATABASE_SCHEMA.sql` file
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Confirm that all queries executed successfully

## Step 5: Enable Authentication

1. In Supabase, go to **Authentication** (left sidebar)
2. Click **Providers**
3. Make sure **Email** provider is enabled (it should be by default)
4. Go back to **Authentication** → **Settings**
5. Under "Email Auth", ensure it's enabled

## Step 6: Update Sign Up Logic (Optional)

The LoginPage component currently has a basic sign-up implementation. To fully enable it:

1. Update the sign-up section in `src/pages/LoginPage.tsx`
2. Replace the sign-up comment with actual Supabase call:

```typescript
if (isSignUp) {
  if (formData.password !== formData.confirmPassword) {
    toast({
      title: 'Error',
      description: 'Passwords do not match',
      variant: 'destructive',
    });
    setIsLoading(false);
    return;
  }
  await signUp(formData.email, formData.password);
  toast({
    title: 'Success',
    description: 'Account created! Check your email to confirm, then log in.',
  });
  setIsSignUp(false);
  setFormData({ email: '', password: '', confirmPassword: '' });
}
```

## Step 7: Start Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Testing the Application

1. **Sign Up**: Create a new account with email and password
2. **Login**: Log in with your credentials
3. **Create Request**: Fill out the service request form
4. **View Dashboard**: See all your service requests
5. **Edit Request**: Click edit to modify any request
6. **Delete Request**: Use the delete button to remove requests
7. **Search**: Use the search bar to filter requests

## Features

### CRUD Operations
- **Create**: Add new service requests from the home page
- **Read**: View all requests on the dashboard or individual request details
- **Update**: Edit any existing request
- **Delete**: Remove requests from the dashboard

### Dashboard Features
- **Statistics**: View total requests, completed, pending, revenue, balance
- **Search**: Filter by customer name, phone, device, ID, or status
- **Quick Actions**: Edit, view details, or delete from the dashboard
- **Status Tracking**: Visual status badges with color coding

### Form Features
- **Single Page Form**: All fields on one scrollable page (not tabs)
- **Auto-Calculations**: Total cost and balance automatically calculated
- **Timeline Tracking**: Add multiple repair steps
- **Comprehensive Fields**: Shop info, customer data, device details, diagnosis, costs, timeline, confirmation

### Authentication
- **Login/Signup**: Secure email-based authentication
- **Protected Routes**: All pages except login require authentication
- **Session Management**: Automatic logout when session expires
- **User Context**: Access to authenticated user throughout the app

## Important Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Keep your Anon Key safe** - It's only for public read/write (protected by RLS)
3. **RLS Policies** - All data is protected by row-level security
4. **User Isolation** - Each user can only see their own data

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
Run: `npm install @supabase/supabase-js`

### "Missing Supabase environment variables"
Check that `.env.local` exists and has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Authentication not working"
1. Check that Email provider is enabled in Supabase Authentication settings
2. Verify `.env.local` has correct URL and key
3. Check browser console for specific error messages

### "Can't see data after creating requests"
1. Verify RLS policies are enabled
2. Check that you're logged in with the same account that created the data
3. Refresh the page to ensure data is loaded

## Next Steps

Consider adding:
1. **Export to PDF**: Generate PDF reports of service requests
2. **Email Notifications**: Send updates to customers
3. **Payment Integration**: Accept online payments
4. **Photo Upload**: Attach before/after photos to requests
5. **SMS Alerts**: Send SMS notifications for status updates
6. **Mobile App**: React Native version for field technicians
7. **Inventory Management**: Track spare parts stock
8. **Customer Portal**: Let customers track their repairs

## Support

For Supabase documentation: https://supabase.com/docs
For issues with the app: Check the browser console and server logs
