import "reflect-metadata";
import "dotenv/config";
import path from "path";
import { DataSource } from "typeorm";

import { config } from "./app.config";

export const getDatabaseConfig = () => {
  const isProduction = config.NODE_ENV === "production";
  const databaseUrl = config.DATABASE_URL;

  // Check if this is a Supabase connection (contains supabase.co)
  const isSupabase = databaseUrl?.includes('supabase.co');
  
  // Determine SSL configuration
  // - Production: Always use SSL
  // - Supabase: Always use SSL (required by Supabase)
  // - Local development: No SSL
  const shouldUseSSL = isProduction || isSupabase;

  // For Supabase, we need to remove sslmode from URL and use SSL object instead
  // This ensures our SSL configuration (rejectUnauthorized: false) is properly applied
  let finalDatabaseUrl = databaseUrl;
  if (isSupabase && databaseUrl.includes('sslmode=')) {
    // Remove sslmode parameter from URL - we'll handle SSL via the ssl object
    finalDatabaseUrl = databaseUrl.replace(/[?&]sslmode=[^&]*/, '').replace(/[?&]$/, '');
  }

  // Check if running in Lambda
  const isLambda = process.env.AWS_EXECUTION_ENV !== undefined;

  const dataSourceOptions: any = {
    type: "postgres",
    url: finalDatabaseUrl,
    entities: [path.join(__dirname, "../database/entities/*{.ts,.js}")],
    migrations: [path.join(__dirname, "../database/migrations/*{.ts,.js}")],
    synchronize: !isProduction,
    logging: isProduction ? ["error"] : ["error"],
    // Connection pool settings optimized for serverless + Supabase
    extra: {
      // For Lambda, use minimal connections
      max: isLambda ? 1 : 10, // Single connection per Lambda instance
      min: isLambda ? 0 : 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      // Supabase pooler compatibility
      application_name: 'khanflow-backend',
      // Keep connections alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    },
  };

  // SSL configuration:
  // - Supabase: Use SSL but don't reject unauthorized (Supabase uses valid certs, but Node.js might have issues)
  // - Production: Use SSL with strict validation
  // - Local development: No SSL
  if (shouldUseSSL) {
    if (isSupabase) {
      // For Supabase, we need to set rejectUnauthorized to false to avoid certificate chain issues
      dataSourceOptions.ssl = {
        rejectUnauthorized: false,
      };
    } else {
      dataSourceOptions.ssl = {
        rejectUnauthorized: true,
      };
    }
  } else {
    dataSourceOptions.ssl = false;
  }

  return new DataSource(dataSourceOptions);
};

export const AppDataSource = getDatabaseConfig();
