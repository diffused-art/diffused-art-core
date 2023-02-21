import { Commitment, Connection, SignatureStatus } from '@solana/web3.js';

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const awaitTransactionSignatureConfirmation = async (
  txid: string,
  timeout: number,
  connection: Connection,
  commitment: Commitment = 'confirmed',
  queryStatus = false,
): Promise<SignatureStatus | null | void> => {
  let done = false;
  let status: SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.debug('Rejecting for timeout...');
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result: any, context: any) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.debug('Rejected via websocket', result.err);
            reject(status);
          } else {
            console.debug('Resolved via websocket', result);
            resolve(status);
          }
        },
        commitment,
      );
    } catch (e) {
      done = true;
      console.error('WS error in setup', txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          console.debug(signatureStatuses);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.debug('REST null result for', txid, status);
            } else if (status.err) {
              console.debug('REST error for', txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.debug('REST no confirmations for', txid, status);
            } else {
              console.debug('REST confirmation for', txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.debug('REST connection error: txid', txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  connection.removeSignatureListener(subId).catch(() => true);
  done = true;
  console.debug('Returning status ', status);
  return status;
};
