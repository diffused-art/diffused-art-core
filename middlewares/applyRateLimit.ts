import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { applyMiddleware } from './applyMiddleware';
import RedisClient from 'ioredis';

export const getIP = request =>
  request.ip ||
  request.headers['x-forwarded-for'] ||
  request.headers['x-real-ip'] ||
  request.connection.remoteAddress;

const connection = {
  host: process.env.REDIS_HOST!,
  port: 6379,
};

const client =
  process.env.NODE_ENV === 'development'
    ? new RedisClient(connection)
    : new RedisClient.Cluster([connection]);

export const getRateLimitMiddlewares = ({
  limit = 100,
  windowMs = 60 * 1000,
} = {}) => [
  rateLimit({
    keyGenerator: getIP,
    windowMs,
    max: process.env.NODE_ENV === 'development' ? 1000000 : limit,
    store: new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => client.call(...args),
      prefix: 'rateLimit-',
    }),
  }),
];

export async function applyRateLimit(request, response, middlewares) {
  await Promise.all(
    middlewares
      .map(applyMiddleware)
      .map(middleware => middleware(request, response)),
  );
}
