# Service Hub Pro

A comprehensive technical service request management application for tracking device repairs and service operations with **full CRUD functionality**, **secure REST API**, and a **Node.js + Express + MongoDB backend**.

## Key Features

### Authentication & User Management
- **Simple Login/Signup (Local)** for development
- **Protected Routes** in frontend
- **Session Persistence** via `localStorage`
- Backend-ready for JWT/RBAC (can be enabled later)

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

### Data Persistence & Backend
- **Backend**: Node.js + Express (`server/`)
- **Database**: MongoDB via Mongoose
- **Indexes**: Status+created_at, customer_phone, serial_number, customer_name
- **Optional Field Encryption**: AES-256-GCM for PII (email/phone)
- **Health Endpoint**: `/health` reports DB readyState
- **API Docs**: Swagger UI at `/docs`
- **Logging**: `pino` + `pino-http`
- **Security**: `helmet`, `cors`, compression, rate limiting

## Technology Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui components
- **Routing**: React Router v6
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Authentication**: Local dev (storage); backend-ready for JWT
- **Build Tool**: Vite (frontend), TypeScript (backend)
- **UI Components**: shadcn-ui
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query)
- **Validation**: Zod (backend) + TypeScript types

## Project Structure

```
service-hub-pro/
├── src/                                # Frontend
│   ├── pages/                          # Login, Dashboard, Form, View, NotFound
│   ├── components/                     # UI components
│   ├── contexts/AuthContext.tsx        # Local dev auth context
│   ├── lib/api.ts                      # REST API client (fetch)
│   ├── types/database.ts               # TypeScript types
│   └── main.tsx                        # Entry point
├── server/                             # Backend
│   ├── src/
│   │   ├── server.ts                   # Bootstrap
│   │   ├── app.ts                      # Express app, middleware, routes
│   │   ├── config/env.ts               # Env parsing & validation
│   │   ├── db/mongo.ts                 # Mongoose connection & pooling
│   │   ├── models/request.model.ts     # Mongoose schema & indexes
│   │   ├── services/requests.service.ts# CRUD with MongoDB
│   │   ├── controllers/requests.controller.ts
│   │   ├── routes/requests.routes.ts   # REST endpoints
│   │   ├── middlewares/*               # logger, rateLimit, error
│   │   └── docs/swagger.ts             # Swagger spec
│   ├── tests/                          # Vitest + supertest
│   │   ├── requests.int.test.ts        # Integration tests
│   │   ├── requests.unit.test.ts       # Unit tests
│   │   └── setup.ts                    # mongodb-memory-server
│   ├── .env.example                    # Backend env template
│   └── package.json                    # Backend scripts & deps
├── vite.config.ts                      # Frontend config
└── README.md                           # This documentation
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd service-hub-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

3. **Configure Backend**
   ```bash
   cd server
   copy .env.example .env
   # set values in .env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=technical_records
   MONGODB_MIN_POOL_SIZE=5
   MONGODB_MAX_POOL_SIZE=20
   FIELD_ENCRYPTION_KEY=<32-byte hex key>
   ```

4. **Start Servers**
   ```bash
   # backend
   cd server && npm run dev
   # frontend (in another terminal)
   cd .. && npm run dev
   ```

5. **Optional Frontend Config**
   - Create `.env.local` in project root:
   ```
   VITE_API_BASE_URL=https://abelov-technical-records-backend.onrender.com
/api/v1
   ```

6. **Open in browser**
   - Navigate to `http://localhost:5173`

## Routes (Frontend)

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

## API Reference (Backend)

Base URL: `https://abelov-technical-records-backend.onrender.com
/api/v1`

Endpoints:
- `GET /requests` — list all requests
- `POST /requests` — create a request
- `GET /requests/:id` — get by id
- `PUT /requests/:id` — update by id
- `DELETE /requests/:id` — delete by id
- `GET /health` — service and DB status
- `GET /docs` — Swagger UI

Frontend `serviceRequestAPI` calls these endpoints:

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

- **JWT Auth**: Secure HTTP-only cookies for session management
- **Protected Routes**: Backend middleware verifies tokens for all request operations
- **Role-based Access**: Foundation laid for user/admin roles

## Security & Best Practices

- **Helmet**: secure HTTP headers
- **CORS**: restricted origins (configurable)
- **Rate Limiting**: applied to `/api/*`
- **Authentication**: JWT-based protection for all critical API endpoints
- **Compression**: gzip responses
- **Logging**: structured logs with `pino`
- **Input Validation**: Zod schemas for payloads
- **Encryption (optional)**: AES-256-GCM on sensitive fields

## Environment Variables

### Frontend
```
VITE_API_BASE_URL=https://abelov-technical-records-backend.onrender.com
/api/v1
```

### Backend (`server/.env`)
```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=technical_records
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_POOL_SIZE=20
FIELD_ENCRYPTION_KEY=<32-byte hex key>
```

## Build, Test & Deployment

### Frontend
```bash
npm run build
npm run preview
npm run lint
```

### Backend
```bash
cd server
npm run build
npm start
npm test
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

- **Express**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **Swagger/OpenAPI**: https://swagger.io/
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn-ui**: https://ui.shadcn.com

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v3.0.0 (Current)
- ✅ Migrated backend to Node.js + Express + MongoDB
- ✅ Added RESTful API with controllers/services/routes
- ✅ Implemented security: helmet, cors, compression, rate limiting
- ✅ Added structured logging with pino
- ✅ Added Swagger docs at `/docs`
- ✅ Added health endpoint with DB status
- ✅ Frontend now calls REST API (`VITE_API_BASE_URL`)
- ✅ Simplified dev auth with local storage
- ✅ Unit & integration tests for backend
- ✅ **Security Hardening**: Applied JWT authentication middleware to all service request and admin endpoints to prevent unauthorized access.
- ✅ **RBAC**: Implemented Role-Based Access Control to restrict sensitive admin operations.

### v2.0.0
- ✅ Supabase backend integration and authentication
- ✅ Dashboard statistics and single-page form layout

### v1.0.0
- ✅ Initial release with local storage
