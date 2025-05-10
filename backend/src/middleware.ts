import express from 'express';
import cors from 'cors';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'; 
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400 // Cache preflight request results for 1 day (in seconds)
}));

app.use(bodyParser.json());


// Initialize Clerk middleware
const clerkMiddleware = ClerkExpressWithAuth();

// Middleware to check authentication for all routes except static files or public routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Skip auth for webhook endpoints
  if (req.path.startsWith('/api/webhook')) {
    return next();
  }
  
  // Skip auth for Stripe API testing endpoints
  // IMPORTANT: THIS IS THE KEY CHANGE - allow API routes to bypass auth during testing
  if (req.path.startsWith('/api/create-customer') || 
      req.path.startsWith('/api/debug-create-customer') ||
      req.path.startsWith('/api/test-stripe-connection')) {
    return next();
  }
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
