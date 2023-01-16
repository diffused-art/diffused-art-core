import { getToken } from 'next-auth/jwt';

export const applyRequireAuth = (req) =>
  new Promise(async (resolve, reject) => {
    const token = await getToken({ req });
    if (token === null) {
      return reject('Not authenticated');
    }
    const isExpirated = new Date().getTime() / 1000 > (token as any)?.exp;
    if (isExpirated) {
      return reject('Token expired, refresh the page and try again');
    }

    return resolve(true);
  });
