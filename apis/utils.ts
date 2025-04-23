import vybeApi from '@api/vybe-api';

const vybe_token = process.env.VYBE_TOKEN;
vybeApi.auth(vybe_token);

/**
 * Retrieves token information for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @returns {Promise<Object>} - Object containing total value and token details
 */
export async function getWalletTokens(ownerAddress: string) {
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

/**
 * Retrieves NFT collection information for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @returns {Promise<Object>} - Object containing total values and NFT collection details
 */
export async function getWalletNFTs(ownerAddress) {
  try {
    // Fetch wallet NFT data
    const response = await vybeApi.get_wallet_nfts({ ownerAddress });

    // Extract main data points
    const {
      totalSol,
      totalUsd,
      totalNftCollectionCount,
      data
    } = response.data;

    // Map collections to a cleaner format
    const collections = data.map(collection => {
      return {
        name: collection.name,
        collectionAddress: collection.collectionAddress,
        itemCount: collection.totalItems,
        valueSol: parseFloat(collection.valueSol),
        priceSol: parseFloat(collection.priceSol),
        valueUsd: parseFloat(collection.valueUsd),
        priceUsd: parseFloat(collection.priceUsd),
        imageUrl: collection.logoUrl
      };
    });

    // Sort collections by USD value (highest first)
    const sortedCollections = collections.sort((a, b) => b.valueUsd - a.valueUsd);

    // Calculate total item count across all collections
    const totalNftCount = collections.reduce((sum, collection) => sum + collection.itemCount, 0);

    // Return formatted response
    return {
      summary: {
        totalValueSol: parseFloat(totalSol),
        totalValueUsd: parseFloat(totalUsd),
        collectionCount: totalNftCollectionCount,
        totalNftCount: totalNftCount
      },
      collections: sortedCollections
    };
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    throw error;
  }
}


/**
 * Get latest token data summary
*/
export async function getTokensSummary(limit = 10) {
  try {

    // Fetch token summary data
    const response = await vybeApi.get_tokens_summary({ limit });

    // Map tokens to a cleaner format
    const tokens = response.data.data.map(token => {
      return {
        symbol: token.symbol,
        name: token.name,
        mintAddress: token.mintAddress,
        // Format price values to 6 decimal places and convert to numbers
        price: Number(token.price.toFixed(6)),
        price1d: Number(token.price1d.toFixed(6)),
        price7d: Number(token.price7d.toFixed(6)),
        decimal: token.decimal,
        logoUrl: token.logoUrl,
        category: token.category || 'Uncategorized',
        subcategory: token.subcategory || 'Uncategorized',
        verified: token.verified,
        updateTime: new Date(token.updateTime * 1000).toISOString(),
        // Format large numbers for readability
        currentSupply: Number(token.currentSupply.toFixed(2)).toLocaleString(),
        marketCap: Number(token.marketCap.toFixed(2)).toLocaleString(),
        // Handle null values for volume
        tokenAmountVolume24h: token.tokenAmountVolume24h ?
          Number(token.tokenAmountVolume24h.toFixed(2)).toLocaleString() : 0,
        usdValueVolume24h: token.usdValueVolume24h ?
          Number(token.usdValueVolume24h.toFixed(2)).toLocaleString() : 0
      };
    });

    return {
      count: tokens.length,
      tokens: tokens
    };
  } catch (error) {
    console.error('Error fetching token summary:', error);
    throw error;
  }
}
