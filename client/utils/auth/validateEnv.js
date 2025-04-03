// utils/validateEnv.js

import logger from "@/lib/logger";

export function validateEnv() {
  const requiredEnvVars = [
    "AUTH_ROUTES",
    "ROLE_DASHBOARD_MAP",
    "REFRESH_TOKEN_URL",
    "LOGIN_URL",
    "DASHBOARD_BASE_URL",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  // // Print all environment variables (useful for debugging)
  // requiredEnvVars.forEach((varName) => {
  //   logger.info(`${varName}: ${process.env[varName] ? process.env[varName] : "Not Set"}`);
  // });

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  // Validate JSON structure for ROLE_DASHBOARD_MAP
  try {
    JSON.parse(process.env.ROLE_DASHBOARD_MAP);
  } catch (error) {
    logger.error("ROLE_DASHBOARD_MAP must be a valid JSON string.");
    throw new Error("Invalid ROLE_DASHBOARD_MAP configuration.");
  }
}


