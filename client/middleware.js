import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth/jwtUtils";
import { AuthRefreshRequest } from "@/utils/auth/authRequests";

// Define the base path without spaces
const BASE_PATH = "/funnel-management";

// Routes accessible without a token (auth routes)
const AUTH_ROUTES = ["/login", "/forgot-password"];

// Protected dashboard routes (without the base path)
const ROLE_DASHBOARD_MAP = {
  trainer: "/dashboard/trainer",
  student: "/dashboard/student",
  "super-admin": "/dashboard/super-admin",
  "sub-admin": "/dashboard/sub-admin",
};

// Role priority list for determining the highest role
const ROLE_PRIORITY_LIST = ["super-admin", "sub-admin", "trainer", "student"];

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
    console.log("Token extracted from header:", token);
  } else {
    const cookie = request.cookies.get("accessToken");
    token = cookie?.value || null;
    console.log("Token extracted from cookie:", token);
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
 * Helper to set cookies on the response
 */
function setCookies(response, tokens) {
  const currentTime = Math.floor(Date.now() / 1000);

  if (tokens.accessExp) {
    const accessMaxAge = Math.max(tokens.accessExp - currentTime, 0);
    response.cookies.set({
      name: "accessToken",
      value: tokens.accessToken,
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: accessMaxAge,
    });
  }

  if (tokens.refreshExp) {
    const refreshMaxAge = Math.max(tokens.refreshExp - currentTime, 0);
    response.cookies.set({
      name: "refreshToken",
      value: tokens.refreshToken,
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: refreshMaxAge,
    });
  }

  return response;
}

/**
 * Validates the current token or attempts to refresh it.
 * @param {Request} request - The incoming request object
 * @returns {Promise<Object|null>} - Object with payload and optional newTokens, or null if invalid
 */
async function getValidPayload(request) {
  const credentials = getUserCredentials(request);

  // 1. Try to verify access token
  if (credentials.access_token) {
    try {
      const payload = await verifyToken(credentials.access_token);
      if (payload) {
        return { payload, newTokens: null };
      }
    } catch (error) {
      console.log("Access token verification failed, trying refresh...");
    }
  }

  // 2. Try refresh token
  const refreshTokenCookie = request.cookies.get("refreshToken");
  const refreshToken = refreshTokenCookie?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    console.log("Attempting to refresh token in middleware...");
    const newTokens = await AuthRefreshRequest('auth_service_fun', 'refresh_token', refreshToken);

    if (newTokens && newTokens.access_token && newTokens.refresh_token) {
      // Verify new access token to get payload and expiry
      const newPayload = await verifyToken(newTokens.access_token);
      const newRefreshPayload = await verifyToken(newTokens.refresh_token);

      if (newPayload) {
        console.log("Token refresh successful");
        return {
          payload: newPayload,
          newTokens: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            accessExp: newPayload.exp,
            refreshExp: newRefreshPayload?.exp
          }
        };
      }
    }
  } catch (error) {
    console.error("Token refresh failed in middleware:", error);
  }

  return null;
}

/**
 * Redirects to the login page.
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - Redirect response to the login page
 */
function redirectToLogin(request) {
  const url = new URL(`${BASE_PATH}/login`, request.url);
  console.log("Redirecting to login", { redirectUrl: url.toString() });
  return NextResponse.redirect(url);
}

/**
 * Redirects to the unauthorized page.
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} - Redirect response to the unauthorized page
 */
function redirectToUnauthorized(request) {
  const url = new URL(`${BASE_PATH}/unauthorized`, request.url);
  console.log("Redirecting to unauthorized", { redirectUrl: url.toString() });
  return NextResponse.redirect(url);
}

/**
 * Middleware to protect routes and handle authentication.
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} - The response based on authentication status
 */
export async function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    // Normalize the path by removing the BASE_PATH if present
    let normalizedPath = pathname.startsWith(BASE_PATH)
      ? pathname.slice(BASE_PATH.length)
      : pathname;

    // Remove trailing slash if present, except for root
    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    console.log("Middleware processing", { pathname, normalizedPath });

    const authResult = await getValidPayload(request);
    const payload = authResult?.payload;
    const newTokens = authResult?.newTokens;

    console.log("User credentials", { hasValidToken: !!payload, refreshed: !!newTokens });

    // Allow access to auth routes without a token
    if (AUTH_ROUTES.includes(normalizedPath)) {
      if (payload) {
        try {
          const highestRole = getHighestPriorityRole(payload.roles);
          if (highestRole && ROLE_DASHBOARD_MAP[highestRole]) {
            const url = new URL(`${BASE_PATH}${ROLE_DASHBOARD_MAP[highestRole]}`, request.url);
            console.log("Redirecting authenticated user", { redirectUrl: url.toString() });
            const response = NextResponse.redirect(url);
            if (newTokens) {
              setCookies(response, newTokens);
            }
            return response;
          }
        } catch (error) {
          console.error("Token verification failed", { error: error.message });
        }
      }
      // If we refreshed tokens but didn't redirect (e.g. user stays on login page? unlikely if logged in),
      // we should still set cookies. But usually if logged in we redirect.
      // If we don't redirect, we return next().
      const response = NextResponse.next();
      if (newTokens) {
        setCookies(response, newTokens);
      }
      return response;
    }

    // Check if the user is accessing the root path (landing page)
    if (normalizedPath === "/" || normalizedPath === "") {
      if (payload) {
        try {
          const highestRole = getHighestPriorityRole(payload.roles);
          if (highestRole && ROLE_DASHBOARD_MAP[highestRole]) {
            const url = new URL(`${BASE_PATH}${ROLE_DASHBOARD_MAP[highestRole]}`, request.url);
            console.log("Redirecting authenticated user from root", { redirectUrl: url.toString() });
            const response = NextResponse.redirect(url);
            if (newTokens) {
              setCookies(response, newTokens);
            }
            return response;
          }
        } catch (error) {
          console.error("Token verification failed at root", { error: error.message });
        }
      }
      // Allow unauthenticated users to see the landing page
      const response = NextResponse.next();
      if (newTokens) {
        setCookies(response, newTokens);
      }
      return response;
    }

    // Protect dashboard routes and their subpaths
    for (const role in ROLE_DASHBOARD_MAP) {
      const dashboardPath = ROLE_DASHBOARD_MAP[role];
      if (normalizedPath.startsWith(dashboardPath)) {
        console.log("Checking protected route", { normalizedPath, role });
        if (!payload) {
          console.warn("No valid token found for protected route", { normalizedPath });
          return redirectToLogin(request);
        }

        const highestRole = getHighestPriorityRole(payload.roles);
        const hasAccess = highestRole === role;

        if (hasAccess) {
          const response = NextResponse.next();
          if (newTokens) {
            setCookies(response, newTokens);
          }
          return response;
        } else {
          return redirectToUnauthorized(request);
        }
      }
    }

    // Allow all other routes
    console.log("Allowing access to non-protected route", { normalizedPath });
    const response = NextResponse.next();
    if (newTokens) {
      setCookies(response, newTokens);
    }
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Configuration for the middleware matcher
export const config = {
  // matcher: [
  //   "/((?!api|_next/static|_next/image|favicon.ico).*)",
  // ],
};