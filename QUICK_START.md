# Quick Start Guide - Service Hub Pro

## 🚀 Get Started in 5 Minutes

### Step 1: Create Supabase Project (1 min)
1. Go to https://supabase.com
2. Click "Sign In"
3. Click "New project"
4. Fill in details and click "Create new project"
5. Wait for it to initialize

### Step 2: Get Your Keys (1 min)
1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **Anon Key** (below the URL)

### Step 3: Configure Project (1 min)
```bash
# In project root
cp .env.example .env.local

# Open .env.local and fill in:
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Setup Database (1 min)
1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy all SQL from `DATABASE_SCHEMA.sql`
4. Paste into editor
5. Click **Run**
6. Done! Tables are created

### Step 5: Start App (1 min)
```bash
npm install
npm run dev
```

Open http://localhost:5173 - Done! 🎉

---

## First Steps

### Create Account
1. Click "Don't have an account? Sign up"
2. Enter email and password
3. Click "Create Account"
4. You're logged in!

### Create Service Request
1. Click "New Request" or go to home
2. Fill in the form sections
3. Add timeline steps if needed
4. Click "Create Request"
5. You're redirected to dashboard

### View Dashboard
- See all your requests
- View statistics (total, completed, revenue, etc.)
- Search by customer name, phone, or device
- Edit, view, or delete requests

### Edit Request
1. Click "Edit" on any request card
2. Make changes
3. Click "Update Request"
4. Changes saved!

### View Request Details
1. Click "View" on any request card
2. See full details
3. Click "Print" to print
4. Click "Edit Request" to make changes

### Search Requests
1. Use the search box on dashboard
2. Type customer name, phone, device, ID, or status
3. Results filter in real-time

---

## Common Tasks

### Add Timeline Step
1. Scroll to "Repair Timeline" section
2. Click "Add Step"
3. Fill in step details (step, date, note, status)
4. Can add multiple steps
5. Delete with trash icon

### Calculate Costs
1. Enter Service Charge
2. Enter Parts Cost
3. Total Cost automatically calculated
4. Enter Deposit Paid
5. Balance automatically calculated

### Track Payment Status
1. Check the cost section
2. Click "Payment Completed" checkbox
3. Dashboard will show payment status

### Search by Status
1. Go to dashboard
2. In search box type: "Completed", "Pending", "In-Progress", or "On-Hold"
3. Requests filter by status

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are filled
- Save file and restart `npm run dev`

### "Cannot authenticate"
- Verify email and password are correct
- Check Supabase Authentication is enabled (it is by default)
- Check browser console for error messages

### "Can't see my requests"
- Make sure you're logged in
- Refresh the page
- Check you created requests while logged in with that account

### "Database tables not found"
- Verify you ran all SQL from DATABASE_SCHEMA.sql
- Check in Supabase SQL Editor → Tables that tables exist
- If not, run the SQL again

### "Form won't submit"
- Check all required fields are filled (marked with *)
- Open browser console (F12) to see any errors
- Check Supabase connection status

---

## Features to Try

✅ Create multiple service requests
✅ Edit existing requests
✅ View request details
✅ Search requests
✅ Delete requests
✅ Track costs and payments
✅ Add repair timeline steps
✅ Print requests
✅ View dashboard statistics
✅ Track customer information

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+S` | Save form (when on form page) |
| `F12` | Open developer console |
| `Ctrl+K` | Open search (on some pages) |
| `Cmd+P` | Print (Mac) / `Ctrl+P` (Windows) |

---

## Tips & Tricks

1. **Bulk Operations**: Edit requests to update them in bulk
2. **Export Data**: Use browser DevTools to export request data
3. **Backup**: Regularly download your data from Supabase
4. **Mobile**: Use on phone browser for field work
5. **Shortcuts**: Bookmark pages for quick access

---

## Next Steps

- Read **README.md** for full feature list
- Check **SUPABASE_SETUP.md** for detailed setup
- See **IMPLEMENTATION.md** for development info
- Explore code in `src/` directory

---

## Need Help?

1. **Setup Issues**: See SUPABASE_SETUP.md
2. **Feature Questions**: See README.md
3. **Code Questions**: Check inline comments in src/
4. **Bugs**: Open browser console (F12) and check for errors

---

## What's Next?

After getting comfortable with the basics:
1. Try bulk creating requests
2. Test the search feature thoroughly
3. Explore all form fields
4. Create reports from your data
5. Consider adding photos or notes
6. Plan for custom features

---

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Supabase)
- Node.js 16+ (for development)
- Text editor for configuration

---

## Support

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Questions: Check documentation files in project

---

**Enjoy using Service Hub Pro! 🎉**

Start with creating a test service request and explore from there.
