import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import app from './index';
import { initializeDatabase } from './database/database';

let serverlessExpressInstance: any;
let isDbInitialized = false;

async function setup(event: APIGatewayProxyEvent, context: Context) {
  // Initialize database if not already done
  if (!isDbInitialized) {
    console.log('Lambda cold start - initializing database...');
    await initializeDatabase();
    isDbInitialized = true;
    console.log('Database initialization complete');
  }
  
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Reuse the serverless express instance for warm starts
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  
  // Cold start: create new instance
  return setup(event, context);
};
