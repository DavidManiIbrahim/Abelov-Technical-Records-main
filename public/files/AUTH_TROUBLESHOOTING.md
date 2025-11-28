# Authentication Troubleshooting Guide

## Issue: "Invalid Credentials" Error on Login

### Common Causes and Solutions

---

## **Problem 1: Email Confirmation Required**

When you create an account in Supabase, it might require email confirmation before you can log in.

### **How to Check:**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to: **Authentication → Settings**
3. Look for "Email Confirmations" setting

### **Solution A: Disable Email Confirmation (Development Only)**
1. In Supabase dashboard, go to **Authentication → Settings**
2. Under "Email Confirmations", toggle OFF
3. Try creating a new account and logging in again

### **Solution B: Enable Unverified Users to Login**
1. In Supabase dashboard, go to **Authentication → Settings**
2. Look for "Require email verification" - make sure it's OFF
3. This allows users to log in before confirming their email

---

## **Problem 2: Using Wrong Password**

After signup, make sure you're using the **exact** password you created.

### **Test Steps:**
1. Signup with: `test@example.com` / `Password123`
2. Switch to Login mode
3. Enter: `test@example.com` / `Password123` (case-sensitive!)
4. If still fails, try signup again with a different email

---

## **Problem 3: Account Not Actually Created**

The signup flow might have failed silently.

### **How to Check:**
1. Go to Supabase dashboard
2. Navigate to: **Authentication → Users**
3. Look for your test email address in the list
4. If not there, the signup didn't work

### **Solution:**
- Check browser console (F12 → Console) for error messages
- Look for any error toasts in the app
- Check that `.env` has correct Supabase credentials

---

## **Problem 4: Incorrect Environment Variables**

If Supabase credentials in `.env` are wrong or missing, auth will fail.

### **How to Check:**
1. Open `/workspaces/service-hub-pro/.env`
2. Verify these lines exist:
   ```
   VITE_SUPABASE_URL=https://vvmwhdrbcnmncwbocsnj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. Make sure there's no extra whitespace

### **If Missing:**
1. Go to: https://app.supabase.com/project/vvmwhdrbcnmncwbocsnj/settings/api
2. Copy your Project URL and Anon Key
3. Update `.env` file with correct values
4. Restart the dev server

---

## **Problem 5: Session Not Loading**

After signup, the auth state might not be updating properly.

### **Solution:**
- Clear browser cache and localStorage
- Open DevTools (F12)
- Go to Application → Storage → Local Storage
- Delete all entries
- Refresh the page
- Try again

---

## **Step-by-Step Debugging**

### **For Signup Issues:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try creating account
4. Look for error messages like:
   - `Invalid login credentials` - Wrong password
   - `User already registered` - Account exists
   - `Email confirmation required` - Need to verify email
   - `Invalid request` - Problem with Supabase connection

### **For Login Issues:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for failed requests
5. Check the response for error details

---

## **Complete Reset Procedure**

If nothing works, try a complete reset:

### **Step 1: Reset Supabase Auth (if you have admin access)**
1. Go to Supabase dashboard
2. Authentication → Users
3. Delete all test users
4. Or create a new test project

### **Step 2: Clear App Cache**
```bash
# Clear node modules and reinstall
cd /workspaces/service-hub-pro
rm -rf node_modules
npm install

# Clear build
rm -rf dist

# Rebuild
npm run build
```

### **Step 3: Clear Browser Cache**
1. Open DevTools (F12)
2. Application → Clear Site Data
3. Or open private/incognito window

### **Step 4: Test Fresh Account**
1. Use a brand new email (never used before)
2. Create account with strong password
3. Immediately try to login
4. Check Supabase Users list to confirm creation

---

## **Recommended Settings for Development**

In Supabase dashboard, set these for easier testing:

### **Authentication → Settings:**
- ✅ Enable signup
- ❌ Disable email confirmations (for dev)
- ❌ Disable SMTP (use built-in)
- ✅ Allow manual insertion of users (for testing)

### **Database → SQL Editor:**
Run this to manually test a user:
```sql
-- Check all users
SELECT id, email, created_at FROM auth.users;

-- Delete a specific user (replace email)
DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

## **Expected Behavior**

### **Signup Flow (Should Work Now)**
1. ✅ Enter email and password
2. ✅ Click "Create Account"
3. ✅ See success message "Account created!"
4. ✅ Form switches to login mode
5. ✅ User appears in Supabase dashboard

### **Login Flow (Should Work Now)**
1. ✅ Enter email and password
2. ✅ Click "Login"
3. ✅ See success message "Logged in successfully"
4. ✅ Redirected to dashboard
5. ✅ User email shows in header

---

## **Code Changes Made**

The following fixes were applied:

### **LoginPage.tsx**
- ✅ Added actual `signUp()` call (was missing!)
- ✅ Added password validation (min 6 chars)
- ✅ Added password confirmation check
- ✅ Added field validation
- ✅ Better error messages

### **AuthContext.tsx**
- ✅ Added error logging
- ✅ Better error messages
- ✅ Return auth data for debugging

---

## **Quick Test Commands**

After fixing, test with:

### **Test 1: Create New Account**
```
Email: testuser@example.com
Password: TestPassword123
Confirm: TestPassword123
```

### **Test 2: Login With That Account**
```
Email: testuser@example.com
Password: TestPassword123
```

### **Expected Result:**
- ✅ Redirected to dashboard
- ✅ Email shows in header
- ✅ Can see service requests list

---

## **Still Having Issues?**

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Supabase Console Logs**: https://app.supabase.com → Logs
3. **Review Network Requests**: DevTools → Network → Look for auth requests
4. **Check Database RLS**: Might be blocking auth (unlikely but possible)

---

## **Contact Support**

If issue persists:
1. Get error message from browser console
2. Check Supabase logs
3. Verify `.env` credentials
4. Try with new Supabase project (test credentials)
5. Clear cache and try incognito window

---

**Last Updated:** November 15, 2025
**Status:** AuthContext updated with better error handling
**Next Action:** Follow "Expected Behavior" section above to test
