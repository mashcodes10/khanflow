import "reflect-metadata";
import { AppDataSource } from "../config/database.config";

// Retry configuration for database connection
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeDatabase = async () => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${MAX_RETRIES}...`);
      
      // Check if already initialized
      if (AppDataSource.isInitialized) {
        console.log("Database already initialized");
        return;
      }
      
      await AppDataSource.initialize();
      console.log("Database connected successfully");
      return;
    } catch (error) {
      lastError = error;
      console.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  // All retries failed
  console.error("Database connection failed after all retries:", lastError);
  
  // In Lambda, don't exit - just log the error and continue
  // The app will handle errors when database is needed
  if (process.env.AWS_EXECUTION_ENV === undefined) {
    process.exit(1);
  }
};
