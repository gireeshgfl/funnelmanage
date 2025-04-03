import { v4 as uuidv4 } from 'uuid';
// import redisSingleton from '@lib/redis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import eventBus from '@/utils/eventBus';

const REDIS_EXPIRY = 3600; // 1 hour in seconds
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

export async function handlePostRequest(data, service, method) {
  try {
    const sessionToken = await getSessionToken();
    const isRedisAvailable = await redisSingleton.checkAvailability();
    // const isRedisAvailable = false


    if (isRedisAvailable) {
      const responseData = await handleAsynchronousRequest(data, service, method, sessionToken);
      return responseData; // Return status 202 for async operations
    } else {
      const responseData = await processSynchronously(data, service, method, sessionToken);
      return responseData; // Return status 200 for sync operations
    }
  } catch (error) {
    logger.error('Error in handlePostRequest:', error);
    return { error: error.message, status: 500 };
  }
}

async function getSessionToken() {
  const sessionCookie = cookies().get('accessToken');
  if (!sessionCookie) {
    throw new Error('Unauthorized: No session cookie found');
  }
  return sessionCookie.value;
}

async function handleAsynchronousRequest(data, service, method, sessionToken) {
  const redisClient = await redisSingleton.getClient();
  const key = uuidv4();
  console.log(data)
  try {
    data.id=key
    // console.log(data)
    // Store initial data with status 'pending' in Redis
    await redisClient.set(
      key,
      JSON.stringify({ status: 'pending', data: null }),
      'EX',
      REDIS_EXPIRY
    );

    // Start asynchronous processing
    processAsynchronously(key, data, service, method, sessionToken).catch(error =>
      logger.error('Asynchronous processing error:', error)
    );

    // Return standardized response for async process
    return {
      message: 'creation initiated',
      status: 202,
      data: null,
      key: key,
    };
  } catch (error) {
    logger.error('Error in handleAsynchronousRequest:', error);
    throw new Error('Internal Server Error');
  }
}

async function processAsynchronously(key, data, service, method, sessionToken) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${process.env.API_BASE_URL}/${service}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      eventBus.emit('postcallback', { responseData });

      // Update Redis with completed status and data
      await updateRedisEntry(key, { status: 'completed', data: responseData });

      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        logger.error(`Failed to process asynchronously after ${MAX_RETRIES} attempts:`, error);
        // Update Redis with failed status and error message
        await updateRedisEntry(key, { status: 'failed', error: error.message });
        return;
      }
      logger.warn(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

async function processSynchronously(data, service, method, sessionToken) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/${service}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (response.status === 401) {
      const errorData = await response.json(); // Optionally extract error data if available
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });
    }

    // Return standardized response
    return {
      ...responseData,
      key: null,
    };
  } catch (error) {
    logger.error('Error in processSynchronously:', error);
    throw new Error('Internal Server Error');
  }
}

async function updateRedisEntry(key, data) {
  try {
    const redisClient = await redisSingleton.getClient();
    await redisClient.set(key, JSON.stringify(data), 'EX', REDIS_EXPIRY);
  } catch (error) {
    logger.error('Error updating Redis entry:', error);
  }
}
