export const applyMiddleware = middleware => (request, response) =>
  new Promise((resolve, reject) => {
    middleware(request, response, result =>
      result instanceof Error ? reject(result) : resolve(result),
    );
  });
