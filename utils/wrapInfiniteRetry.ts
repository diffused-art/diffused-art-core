import { retry } from 'ts-retry-promise';

export async function wrapInfiniteRetry(promise) {
  return await retry<any>(() => promise(), {
    retries: 'INFINITELY',
    delay: 1000,
    backoff: 'LINEAR',
    timeout: 10000000,
    logger: console.log,
  });
}
