import { getEnv } from "../utils/get-env";

const appConfig = () => ({
  PORT: getEnv("PORT", "8000"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),

  DATABASE_URL: getEnv("DATABASE_URL"),

  JWT_SECRET: getEnv("JWT_SECRET", "secert_jwt"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "1d"),

  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: getEnv("GOOGLE_REDIRECT_URI"),
  GOOGLE_INTEGRATION_REDIRECT_URI: getEnv("GOOGLE_INTEGRATION_REDIRECT_URI"),

  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "localhost"),
  FRONTEND_INTEGRATION_URL: getEnv("FRONTEND_INTEGRATION_URL"),
  
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
});

export const config = appConfig();
