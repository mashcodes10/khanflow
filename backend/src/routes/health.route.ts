import { Router } from "express";
import { AppDataSource } from "../config/database.config";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const dbStatus = AppDataSource.isInitialized 
      ? "connected" 
      : "not initialized";
    
    let dbTest = null;
    if (AppDataSource.isInitialized) {
      try {
        const result = await AppDataSource.query('SELECT NOW() as timestamp, version() as version');
        dbTest = {
          success: true,
          timestamp: result[0].timestamp,
          version: result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]
        };
      } catch (error: any) {
        dbTest = {
          success: false,
          error: error.message
        };
      }
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbStatus,
        test: dbTest
      },
      lambda: {
        isLambda: process.env.AWS_EXECUTION_ENV !== undefined,
        region: process.env.AWS_REGION || "N/A",
        memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "N/A"
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

export default router;
