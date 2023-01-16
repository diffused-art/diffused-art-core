import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { applyMiddleware } from './applyMiddleware';
import RedisClient from 'ioredis';

const getIP = request =>
  request.ip ||
  request.headers['x-forwarded-for'] ||
  request.headers['x-real-ip'] ||
  request.connection.remoteAddress;

const client = new RedisClient(process.env.REDIS_URL!);

export const getRateLimitMiddlewares = ({
  limit = 100,
  windowMs = 60 * 1000,
} = {}) => [
  rateLimit({
    keyGenerator: getIP,
    windowMs,
    max: limit,
    store: new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => client.call(...args),
      prefix: 'rateLimit-'
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
