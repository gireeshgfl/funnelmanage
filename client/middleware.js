import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth/jwtUtils";
import logger from "./lib/logger";

// Define the base path without spaces
const BASE_PATH = "/funnel-management";

// Routes accessible without a token (auth routes)
// Routes accessible without a token (auth routes)
const AUTH_ROUTES = ["/login", "/forgot-password"];

// Protected dashboard routes (without the base path)
const ROLE_DASHBOARD_MAP = {
  trainer: "/dashboard/trainer",
  student: "/dashboard/student",
  "super-admin": "/dashboard/super-admin",
};

// Role priority list for determining the highest role
const ROLE_PRIORITY_LIST = ["super-admin", "trainer", "student"];

/**
 * Extracts the token from the Authorization header or cookies.
 * @param {Request} request - The incoming request object
 * @returns {Object} - Object containing the access token
 */
function getUserCredentials(request) {
  const authHeader = request.headers.get("authorization");
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    logger.debug("Token extracted from header:", token);
  } else {
    const cookie = request.cookies.get("accessToken");
    token = cookie?.value || null;
    logger.debug("Token extracted from cookie:", token);
  }
  return { access_token: token };
}

/**
 * Determines the highest priority role from a list of roles.
 * @param {string[]} roles - Array of user roles
 * @returns {string|null} - The highest priority role or null if none match
 */
function getHighestPriorityRole(roles) {
  return ROLE_PRIORITY_LIST.find((role) => roles.includes(role)) || null;
}

/**
 * Verifies if the token grants access to the requested role.
 * @param {Object} credentials - User credentials containing the access token
 * @param {string} requestedRole - The role required for the route
 * @returns {Promise<boolean>} - True if access is granted, false otherwise
 */
async function checkUserRole(credentials, requestedRole) {
  try {
    const payload = await verifyToken(credentials.access_token);
    const highestRole = getHighestPriorityRole(payload.roles);
    return highestRole === requestedRole;
  } catch (error) {
    logger.error("Error verifying token", { error: error.message });
    return false;
  }
}

/**
 * Redirects to the login page.
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - Redirect response to the login page
 */
function redirectToLogin(request) {
  const url = new URL(`${BASE_PATH}/login`, request.url);
  logger.info("Redirecting to login", { redirectUrl: url.toString() });
  return NextResponse.redirect(url);
}

/**
 * Redirects to the unauthorized page.
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - Redirect response to the unauthorized page
 */
function redirectToUnauthorized(request) {
  const url = new URL(`${BASE_PATH}/unauthorized`, request.url);
  logger.info("Redirecting to unauthorized", { redirectUrl: url.toString() });
  return NextResponse.redirect(url);
}

/**
 * Middleware to protect routes and handle authentication.
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} - The response based on authentication status
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  // Normalize the path by removing the BASE_PATH if present
  let normalizedPath = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length)
    : pathname;

  // Remove trailing slash if present, except for root
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  logger.info("Middleware processing", { pathname, normalizedPath });
  const credentials = getUserCredentials(request);
  logger.info("User credentials", { hasToken: !!credentials.access_token });

  // Allow access to auth routes without a token
  if (AUTH_ROUTES.includes(normalizedPath)) {
    if (credentials.access_token) {
      try {
        const payload = await verifyToken(credentials.access_token);
        const highestRole = getHighestPriorityRole(payload.roles);
        if (highestRole && ROLE_DASHBOARD_MAP[highestRole]) {
          const url = new URL(`${BASE_PATH}${ROLE_DASHBOARD_MAP[highestRole]}`, request.url);
          logger.info("Redirecting authenticated user", { redirectUrl: url.toString() });
          return NextResponse.redirect(url);
        }
      } catch (error) {
        logger.error("Token verification failed", { error: error.message });
      }
    }
    return NextResponse.next();
  }

  // Check if the user is accessing the root path (landing page)
  if (normalizedPath === "/" || normalizedPath === "") {
    if (credentials.access_token) {
      try {
        const payload = await verifyToken(credentials.access_token);
        const highestRole = getHighestPriorityRole(payload.roles);
        if (highestRole && ROLE_DASHBOARD_MAP[highestRole]) {
          const url = new URL(`${BASE_PATH}${ROLE_DASHBOARD_MAP[highestRole]}`, request.url);
          logger.info("Redirecting authenticated user from root", { redirectUrl: url.toString() });
          return NextResponse.redirect(url);
        }
      } catch (error) {
        logger.error("Token verification failed at root", { error: error.message });
      }
    } else {
      // Redirect unauthenticated users to login
      const url = new URL(`${BASE_PATH}/login`, request.url);
      logger.info("Redirecting unauthenticated user from root to login", { redirectUrl: url.toString() });
      return NextResponse.redirect(url);
    }
  }

  // Protect dashboard routes and their subpaths
  for (const role in ROLE_DASHBOARD_MAP) {
    const dashboardPath = ROLE_DASHBOARD_MAP[role];
    if (normalizedPath.startsWith(dashboardPath)) {
      logger.debug("Checking protected route", { normalizedPath, role });
      if (!credentials.access_token) {
        logger.warn("No token found for protected route", { normalizedPath });
        return redirectToLogin(request);
      }
      const hasAccess = await checkUserRole(credentials, role);
      return hasAccess ? NextResponse.next() : redirectToUnauthorized(request);
    }
  }

  // Allow all other routes
  logger.debug("Allowing access to non-protected route", { normalizedPath });
  return NextResponse.next();
}

// Configuration for the middleware matcher
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};