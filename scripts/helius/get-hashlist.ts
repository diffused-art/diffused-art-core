const axios = require('axios');

const url = `https://api.helius.xyz/v1/mintlist?api-key=${process.env.HELIUS_API_KEY}`;

export const getHashlist = async (
  verifiedCollectionAddress: string,
): Promise<string[]> => {
  const { data } = await axios.post(url, {
    query: {
      verifiedCollectionAddresses: [verifiedCollectionAddress],
    },
    options: {
      limit: 10000,
    },
  });

  return data.result.map((value) => value.mint);
};
