# Service Hub Pro

A comprehensive technical service request management application for tracking device repairs and service operations with **full CRUD functionality**, **user authentication**, and **Supabase backend**.

## Key Features

### Authentication & User Management
- **Secure Login/Signup** with email authentication
- **Protected Routes** - all data is private to each user
- **Session Management** - automatic session handling
- **User Isolation** - each user sees only their own data

### Service Request Management
- **Create**: Add new service requests with comprehensive details
- **Read**: View all requests on the dashboard or individual request details
- **Update**: Edit any existing service request
- **Delete**: Remove service requests from the system
- **Search & Filter**: Find requests by customer name, phone, device, ID, or status

### Comprehensive Form
- **Single-Page Form**: All fields visible on one scrollable page (no tabs)
- **8 Sections**:
  1. Shop Information (shop name, technician, date)
  2. Customer Information (name, phone, email, address)
  3. Device Information (model, brand, serial number, OS, accessories)
  4. Problem Description (detailed issue report)
  5. Diagnosis & Repair (diagnosis date, technician, fault, parts, action, status)
  6. Cost Summary (service charge, parts cost, auto-calculated totals and balance)
  7. Repair Timeline (track multiple repair steps with dates and notes)
  8. Customer Confirmation (signature, device collection, technician sign-off)

### Dashboard Features
- **Statistics Cards**: 
  - Total requests count
  - Completed requests
  - Pending requests
  - In-progress requests
  - Total revenue
  - Outstanding balance
- **Request Cards**: Quick overview of each request with essential info
- **Fast Actions**: Edit, view details, or delete from the dashboard
- **Smart Search**: Real-time search across multiple fields

### Cost Management
- **Auto-Calculation**: Total cost = service charge + parts cost
- **Balance Tracking**: Balance = total cost - deposit paid
- **Payment Status**: Mark payments as completed
- **Financial Overview**: Dashboard shows total revenue and outstanding balance

### Data Persistence
- **Supabase Backend**: Cloud-based PostgreSQL database
- **Row-Level Security**: Data encrypted and protected per user
- **Real-Time Updates**: Instant synchronization across sessions
- **Automatic Timestamps**: Created and updated times tracked automatically

## Technology Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui components
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
- **UI Components**: shadcn-ui
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query)
- **Data Validation**: TypeScript types

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.tsx                  # Authentication (login/signup)
│   ├── ServiceRequestForm.tsx         # Create/edit service requests
│   ├── ServiceRequestViewPage.tsx     # View request details
│   ├── DashboardPage.tsx              # Dashboard with all requests & stats
│   └── NotFound.tsx                   # 404 error page
├── components/
│   ├── ProtectedRoute.tsx             # Route protection wrapper
│   └── ui/                            # shadcn-ui components
├── contexts/
│   └── AuthContext.tsx                # Authentication context & provider
├── lib/
│   ├── supabase.ts                    # Supabase client setup
│   └── api.ts                         # API service layer (CRUD operations)
├── types/
│   └── database.ts                    # TypeScript type definitions
├── hooks/
│   └── use-toast.ts                   # Toast notification hook
└── main.tsx                           # Entry point

Configuration Files:
├── DATABASE_SCHEMA.sql                # Supabase SQL schema
├── SUPABASE_SETUP.md                  # Detailed setup instructions
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── .env.example                       # Environment variables template
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Supabase account (free at https://supabase.com)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd service-hub-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a Supabase project
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and Anon Key
   - See `SUPABASE_SETUP.md` for detailed instructions

4. **Set up database**
   - Run the SQL from `DATABASE_SCHEMA.sql` in Supabase SQL Editor
   - This creates all necessary tables with Row-Level Security

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Create account or login

## Routes

- `/login` - Authentication page (login/signup)
- `/` - Create new service request (protected)
- `/edit/:id` - Edit existing service request (protected)
- `/view/:id` - View request details (protected)
- `/dashboard` - Dashboard with all requests and statistics (protected)

## Usage Examples

### Creating a Service Request
1. Click "New Request" or go to home page
2. Fill in all the details across the 8 sections
3. Costs automatically calculate as you enter values
4. Add timeline steps by clicking "Add Step"
5. Click "Create Request" to save

### Editing a Request
1. Go to dashboard
2. Click "Edit" on any request card
3. Modify the details
4. Click "Update Request" to save changes

### Viewing Request Details
1. Go to dashboard
2. Click "View" on any request card
3. See all information in a read-only format
4. Print the request if needed
5. Click "Edit Request" to make changes

### Searching Requests
1. Use the search box on the dashboard
2. Type to filter by:
   - Customer name
   - Phone number
   - Device brand/model
   - Request ID
   - Status

## API Reference

All CRUD operations are available through the `serviceRequestAPI`:

```typescript
// Create
serviceRequestAPI.create(request: ServiceRequest)

// Read one
serviceRequestAPI.getById(id: string)

// Read all for user
serviceRequestAPI.getByUserId(userId: string)

// Update
serviceRequestAPI.update(id: string, updates: Partial<ServiceRequest>)

// Delete
serviceRequestAPI.delete(id: string)

// Search
serviceRequestAPI.search(userId: string, query: string)

// Get by status
serviceRequestAPI.getByStatus(userId: string, status: string)

// Get statistics
serviceRequestAPI.getStats(userId: string)
```

## Authentication

The app uses Supabase Authentication with:
- Email-based login/signup
- Automatic session management
- Protected routes that redirect to login
- User context available throughout the app

## Database Security

All data is protected by:
- **Row-Level Security (RLS)**: Each user sees only their data
- **User Isolation**: Queries automatically filtered by user ID
- **Timestamps**: Automatic created_at and updated_at tracking
- **Constraints**: Data validation at database level

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Build & Deployment

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## Recommended Features to Add

1. **Export to PDF** - Generate downloadable service reports
2. **Email Notifications** - Send updates to customers
3. **Photo Upload** - Attach device photos to requests
4. **SMS Alerts** - Send status updates via text
5. **Payment Integration** - Accept online payments
6. **Inventory Management** - Track spare parts stock
7. **Mobile App** - React Native version for field work
8. **Customer Portal** - Public page for customers to track repairs
9. **Advanced Reports** - Generate business analytics
10. **Multi-location Support** - Manage multiple shops

## Troubleshooting

### "Not authenticated" error
- Ensure you're logged in
- Check `.env.local` has correct Supabase credentials

### Cannot see database data
- Verify Supabase tables were created from `DATABASE_SCHEMA.sql`
- Check that RLS policies are enabled
- Ensure you're viewing your own data

### Form not submitting
- Check browser console for errors
- Verify all required fields are filled (marked with *)
- Check Supabase connection in Network tab

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn-ui**: https://ui.shadcn.com

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v2.0.0 (Current)
- ✅ Added Supabase backend integration
- ✅ Implemented user authentication (login/signup)
- ✅ Created full CRUD operations
- ✅ Built comprehensive dashboard with statistics
- ✅ Converted tabbed form to single-page layout
- ✅ Added protected routes
- ✅ Implemented Row-Level Security
- ✅ Added advanced search and filtering

### v1.0.0
- ✅ Initial release with local storage
- ✅ Tabbed service request form
- ✅ Basic CRUD operations
- ✅ Service request list view
