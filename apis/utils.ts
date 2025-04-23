import vybeApi from '@api/vybe-api';

const vybe_token = process.env.VYBE_TOKEN;
vybeApi.auth(vybe_token);

/**
 * Retrieves token information for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @param {string} [token] - Optional API token, will use environment variable if not provided
 * @returns {Promise<Object>} - Object containing total value and token details
 */
export async function getWalletTokens(ownerAddress: string, token = null) {
  try {
    // Fetch wallet data
    const response = await vybeApi.get_wallet_tokens({ ownerAddress });

    // Extract only necessary data
    const { totalTokenValueUsd, data } = response.data;

    // Map tokens to simplified format
    const tokens = data.map(token => ({
      name: token.name,
      symbol: token.symbol,
      valueUsd: token.valueUsd
    }));

    // Return formatted response
    return {
      totalValueUsd: totalTokenValueUsd,
      tokenCount: tokens.length,
      tokens
    };
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    throw error;
  }
}
