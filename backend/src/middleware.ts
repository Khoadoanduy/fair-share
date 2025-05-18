import express from 'express';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'; 
import { Request, Response, NextFunction } from 'express';

const app = express();

// Initialize Clerk middleware
const clerkMiddleware = ClerkExpressWithAuth();

// Middleware to check authentication for all routes except static files or public routes
app.use((req, res, next) => {
  const protectedRoutePattern = /^(?!.*\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*/;
  // Apply Clerk authentication middleware only to routes that match the pattern
  if (protectedRoutePattern.test(req.path)) {
    clerkMiddleware(req, res, next);  // Protect route with Clerk
  } else {
    next();  // Allow public routes to pass through
  }
});

// Example of a protected route
app.get('/protected', (req: Request, res: Response) => {
  res.send('This is a protected route');
});

// Example of an API route
app.get('/api/data', (req: Request, res: Response) => {
  res.json({ message: 'API response' });
});

// Static files (non-protected routes)
app.use(express.static('public'));

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});