# Fair Share Backend

This is the backend server for the Fair Share application. It uses Express for the API server and Prisma as the ORM for database operations.

## Authentication Middleware

The backend uses Clerk for authentication. The authentication flow works as follows:

1. The frontend obtains a JWT token from Clerk
2. The frontend includes this token in the Authorization header of API requests
3. The backend verifies the token using Clerk's JWKS endpoint
4. If valid, the user information is extracted and added to the request object
5. The middleware also syncs the Clerk user with our database using Prisma

## Database with Prisma

The application uses Prisma ORM to interact with a PostgreSQL database. The database schema includes:

- Users (synced with Clerk)
- Groups for shared expenses
- Group memberships
- Expenses
- Expense shares

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=8002
DATABASE_URL="postgresql://postgres:password@localhost:5432/fairshare?schema=public"
CLERK_ISSUER=https://enabling-mako-34.clerk.accounts.dev
CLERK_JWKS_ENDPOINT=https://enabling-mako-34.clerk.accounts.dev/.well-known/jwks.json
```

## JWT Claims

The JWT token from Clerk contains the following custom claims:

```json
{
  "userID": "user_id_from_clerk",
  "userEmail": "user_email@example.com",
  "userFullName": "User Full Name"
}
```

## Protected Routes

To protect a route, use the `authMiddleware`:

```javascript
import { authMiddleware } from './middleware/auth.js';

// Apply to a single route
app.get('/api/protected-resource', authMiddleware, (req, res) => {
  // Access user info with req.user (database user) and req.clerkUser (Clerk user)
  res.json({ message: `Hello, ${req.user.firstName}!` });
});

// Or apply to all routes under a specific path
app.use('/api/protected', authMiddleware);
app.get('/api/protected/resource', (req, res) => {
  // All routes under /api/protected will have req.user
  res.json({ user: req.user });
});
```

## Installation and Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up the database:
   ```
   npx prisma migrate dev --name init
   ```

3. Generate Prisma client:
   ```
   npx prisma generate
   ```

4. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## Prisma Studio

You can use Prisma Studio to view and edit your database:

```
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can manage your data.