# Multi-Tenant SaaS Notes Application

A simple multi-tenant notes application with JWT authentication, role-based access control, and subscription-based feature gating.

## Multi-Tenancy Approach

**Chosen Approach: Shared Schema with Tenant ID Column**

This implementation uses a shared database/storage with a `tenantSlug` field to isolate data between tenants. This approach was chosen for its simplicity and efficiency for small to medium scale applications.

### Benefits:
- Simple to implement and maintain
- Cost-effective (single database)
- Easy to add new tenants
- Efficient resource utilization

### Data Isolation:
- All data includes a `tenantSlug` field
- API endpoints filter data by the authenticated user's tenant
- No cross-tenant data access is possible

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Two roles: Admin and Member
- Role-based endpoint protection

### 🏢 Multi-Tenancy
- Support for multiple tenants (Acme and Globex)
- Strict data isolation
- Tenant-specific operations

### 📝 Notes Management
- Full CRUD operations for notes
- Tenant-isolated note storage
- Real-time note count tracking

### 💳 Subscription Management
- Free Plan: Maximum 3 notes
- Pro Plan: Unlimited notes
- Admin-only upgrade capability

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Authentication
```
POST /auth/login
Body: { "email": "user@acme.test", "password": "password" }
Response: { "token": "jwt-token", "user": {...} }

GET /auth/me
Headers: Authorization: Bearer <token>
Response: { "user": {...} }
```

### Tenant Management
```
GET /tenants/:slug
Headers: Authorization: Bearer <token>
Response: { "slug": "acme", "name": "Acme Corp", "plan": "Free" }

POST /tenants/:slug/upgrade
Headers: Authorization: Bearer <token>
Requires: Admin role
Response: { "message": "Subscription upgraded to Pro", "tenant": {...} }
```

### Notes CRUD
```
GET /notes
Headers: Authorization: Bearer <token>
Response: [{ "id": 1, "title": "Note", "content": "Content", ... }]

POST /notes
Headers: Authorization: Bearer <token>
Body: { "title": "My Note", "content": "Note content" }
Response: { "id": 1, "title": "My Note", ... }

GET /notes/:id
Headers: Authorization: Bearer <token>
Response: { "id": 1, "title": "My Note", ... }

PUT /notes/:id
Headers: Authorization: Bearer <token>
Body: { "title": "Updated", "content": "Updated content" }
Response: { "id": 1, "title": "Updated", ... }

DELETE /notes/:id
Headers: Authorization: Bearer <token>
Response: { "message": "Note deleted successfully" }
```

## Test Accounts

All accounts use password: `password`

- **admin@acme.test** - Admin role, Acme tenant
- **user@acme.test** - Member role, Acme tenant  
- **admin@globex.test** - Admin role, Globex tenant
- **user@globex.test** - Member role, Globex tenant

## Deployment Instructions

### Backend Deployment
1. Create a new Vercel project
2. Upload these files:
   - `index.js`
   - `package.json`
   - `vercel.json`
3. Deploy to Vercel
4. Note the API URL for frontend configuration

### Frontend Deployment  
1. Create another Vercel project
2. Update the `API_BASE` constant in `index.html` with your backend URL
3. Upload:
   - `index.html`
   - `vercel.json` (frontend version)
4. Deploy to Vercel

### Environment Variables
No environment variables are required for basic functionality. The JWT secret defaults to a hardcoded value for simplicity.

## Usage

1. Visit the frontend URL
2. Select one of the predefined test accounts
3. Login with password: `password`
4. Create, view, and delete notes
5. Test subscription limits (Free plan: max 3 notes)
6. Use Admin accounts to upgrade tenant subscriptions

## Security Features

- JWT token authentication
- Role-based access control
- Tenant data isolation
- CORS enabled for API access
- Input validation and error handling

## Limitations & Assumptions

- In-memory storage (data resets on server restart)
- Simplified password validation (all passwords are "password")
- No user registration endpoint (uses predefined accounts)
- No password hashing validation (simplified for demo)

## Testing

The application supports automated testing through:
- Health endpoint availability
- Authentication for all predefined accounts  
- Tenant isolation enforcement
- Role-based access restrictions
- Free plan note limits and Pro upgrade functionality
- Full CRUD operations for notes

## Architecture

```
Frontend (Vercel) → API (Vercel) → In-Memory Storage
     ↓                 ↓              ↓
   React-like        Express.js    Tenant-isolated
   Vanilla JS        + JWT Auth    Data Structure
```

This simple architecture ensures all requirements are met while maintaining clarity and ease of deployment.