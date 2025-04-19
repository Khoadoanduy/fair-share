import { jwtVerify } from "jose";
import fetch from "node-fetch";
import { userService } from "../services/userService.js";
import { ApiError } from "../utils/errorHandler.js";

// Clerk configuration from environment variables
const CLERK_ISSUER =
  process.env.CLERK_ISSUER || "https://enabling-mako-34.clerk.accounts.dev";
const JWKS_ENDPOINT =
  process.env.CLERK_JWKS_ENDPOINT ||
  "https://enabling-mako-34.clerk.accounts.dev/.well-known/jwks.json";

// Cache for JWKS to avoid fetching it on every request
let jwksCache = null;
let jwksCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetches the JSON Web Key Set (JWKS) from Clerk
 * @returns {Promise<Object>} The JWKS
 */
async function getJWKS() {
  // Return cached JWKS if it's still valid
  const now = Date.now();
  if (jwksCache && now - jwksCacheTime < CACHE_DURATION) {
    return jwksCache;
  }

  try {
    const response = await fetch(JWKS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }

    const jwks = await response.json();

    // Update cache
    jwksCache = jwks;
    jwksCacheTime = now;

    return jwks;
  } catch (error) {
    console.error("Error fetching JWKS:", error);
    throw error;
  }
}

/**
 * Authentication middleware that verifies JWT tokens from Clerk
 * and syncs user data with the database
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "Unauthorized: Missing or invalid authorization header"
      );
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    // Get the JWKS
    const jwks = await getJWKS();

    // Verify the token
    const { payload } = await jwtVerify(
      token,
      async (header) => {
        // Find the key that matches the key ID in the JWT header
        const key = jwks.keys.find((k) => k.kid === header.kid);

        if (!key) {
          throw new Error("Matching key not found in JWKS");
        }

        // Import the key as a crypto key
        return await import("crypto").then((crypto) =>
          crypto.createPublicKey({
            key: { ...key, format: "jwk" },
            format: "jwk",
          })
        );
      },
      {
        issuer: CLERK_ISSUER,
        maxTokenAge: "1h", // Adjust as needed
      }
    );

    // Extract user data from the token
    const clerkUserData = {
      id: payload.userID,
      email: payload.userEmail,
      fullName: payload.userFullName,
    };

    // Find or create the user in our database
    const user = await userService.findOrCreateUser(clerkUserData);

    // Add both Clerk user data and our database user to the request
    req.clerkUser = clerkUserData;
    req.user = user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      console.error("Authentication error:", error);
      next(new ApiError(401, "Unauthorized: Invalid token"));
    }
  }
};
