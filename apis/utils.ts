import vybeApi from '@api/vybe-api';
import { generateChartImage } from "./chart"

const vybe_token = process.env.VYBE_TOKEN;
vybeApi.auth(vybe_token);

/**
 * Retrieves token information for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @returns {Promise<Object>} - Object containing total value and token details
 */
export async function getWalletTokens(ownerAddress: any) {
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
 * @returns {Promise<Object>} - Object containing tokens details
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

/**
 * Retrieves PnL for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @returns {Promise<Object>} - Object containing total values for PnL details
 */
export async function getWalletPnL(ownerAddress, resolution: "1d" | "7d" | "30d" = '7d') {
  try {
    // Fetch wallet PnL data
    const response = await vybeApi.get_wallet_pnl({
      resolution: resolution,
      ownerAddress: ownerAddress
    });

    const data = response.data;

    // Format the summary data with null checks
    const summary = {
      winRate: Number((data.summary?.winRate || 0).toFixed(2)),
      realizedPnlUsd: Number((data.summary?.realizedPnlUsd || 0).toFixed(2)),
      unrealizedPnlUsd: Number((data.summary?.unrealizedPnlUsd || 0).toFixed(2)),
      totalPnlUsd: Number(((data.summary?.realizedPnlUsd || 0) + (data.summary?.unrealizedPnlUsd || 0)).toFixed(2)),
      uniqueTokensTraded: data.summary?.uniqueTokensTraded || 0,
      averageTradeUsd: Number((data.summary?.averageTradeUsd || 0).toFixed(2)),
      tradesCount: data.summary?.tradesCount || 0,
      winningTradesCount: data.summary?.winningTradesCount || 0,
      losingTradesCount: data.summary?.losingTradesCount || 0,
      tradesVolumeUsd: Number((data.summary?.tradesVolumeUsd || 0).toFixed(2)),
      bestPerformingToken: data.summary?.bestPerformingToken ? {
        symbol: data.summary.bestPerformingToken.tokenSymbol || "N/A",
        address: data.summary.bestPerformingToken.tokenAddress || "N/A",
        name: data.summary.bestPerformingToken.tokenName || "N/A",
        logoUrl: data.summary.bestPerformingToken.tokenLogoUrl || "",
        pnlUsd: Number((data.summary.bestPerformingToken.pnlUsd || 0).toFixed(2))
      } : null,
      worstPerformingToken: data.summary?.worstPerformingToken ? {
        symbol: data.summary.worstPerformingToken.tokenSymbol || "N/A",
        address: data.summary.worstPerformingToken.tokenAddress || "N/A",
        name: data.summary.worstPerformingToken.tokenName || "N/A",
        logoUrl: data.summary.worstPerformingToken.tokenLogoUrl || "",
        pnlUsd: Number((data.summary.worstPerformingToken.pnlUsd || 0).toFixed(2))
      } : null,
      // Format the trend data with null check
      pnlTrend: (data.summary?.pnlTrendSevenDays || []).map(day => ({
        date: new Date(day[0]).toISOString().split('T')[0],
        pnlUsd: Number((day[1] || 0).toFixed(2))
      }))
    };

    // Format token metrics with null checks
    const tokenMetrics = (data.tokenMetrics || []).map(token => ({
      address: token.tokenAddress || "N/A",
      symbol: token.tokenSymbol || "N/A",
      realizedPnlUsd: Number((token.realizedPnlUsd || 0).toFixed(2)),
      unrealizedPnlUsd: Number((token.unrealizedPnlUsd || 0).toFixed(2)),
      totalPnlUsd: Number(((token.realizedPnlUsd || 0) + (token.unrealizedPnlUsd || 0)).toFixed(2)),
      buys: {
        volumeUsd: Number((token.buys?.volumeUsd || 0).toFixed(2)),
        tokenAmount: Number((token.buys?.tokenAmount || 0).toFixed(2)),
        transactionCount: token.buys?.transactionCount || 0
      },
      sells: {
        volumeUsd: Number((token.sells?.volumeUsd || 0).toFixed(2)),
        tokenAmount: Number((token.sells?.tokenAmount || 0).toFixed(2)),
        transactionCount: token.sells?.transactionCount || 0
      }
    }));

    // Sort tokens by total PnL (highest first)
    const sortedTokenMetrics = tokenMetrics.sort((a, b) => b.totalPnlUsd - a.totalPnlUsd);

    return {
      summary: summary,
      tokenMetrics: sortedTokenMetrics
    };
  } catch (error) {
    console.error('Error fetching wallet PnL:', error);
    throw error;
  }
}

/**
 * Retrieves PnL for a specified wallet address
 * @param {string} ownerAddress - The wallet address to query
 * @returns {Promise<Object>} - Object containing token details
 */
export async function getTokenTransfers(mintAddress: string) {
  try {
    // Fetch token transfer data
    const response = await vybeApi.get_token_transfers({ mintAddress });

    // Ensure response.data.transfers is an array
    if (!Array.isArray(response.data.transfers)) {
      throw new Error('Unexpected response format: transfers is not an array');
    }

    // Extract and format the data as needed
    const transfers = response.data.transfers.map(transfer => ({
      signature: transfer.signature,
      from: transfer.senderAddress,
      to: transfer.receiverAddress,
      amount: transfer.calculatedAmount,
      timestamp: new Date(transfer.blockTime * 1000).toISOString(),
      valueUsd: transfer.valueUsd
    }));

    return {
      count: transfers.length,
      transfers: transfers
    };
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    throw error;
  }
}

/**
 * Retrieves token holders time series data for a specified mint address
 * @param {string} mintAddress - The mint address to query
 * @returns {Promise<Array>} - Array containing token holders time series data
 */
export async function getTokenHoldersTimeSeries(mintAddress: string) {
  try {
    // Fetch token holders time series data
    const response = await vybeApi.get_token_holders_time_series({ interval: 'day', mintAddress });

    // Check if response.data is an object with a 'data' property
    const timeSeriesData = response.data.data;

    if (!Array.isArray(timeSeriesData)) {
      throw new Error('Unexpected response format: data is not an array');
    }

    // Return the data array
    return timeSeriesData;
  } catch (error) {
    console.error('Error fetching token holders time series:', error);
    throw error;
  }
}

/**
 * Retrieves top token holders for a specified mint address
 * @param {string} mintAddress - The mint address to query
 * @returns {Promise<Array>} - Array containing top token holders data
 */

export async function getTokenDetails(mintAddress) {
  try {
    // Fetch token details
    const response = await vybeApi.get_token_details({ mintAddress });

    const tokenData = response.data;

    // Format the token details
    return {
      symbol: tokenData.symbol,
      name: tokenData.name,
      mintAddress: tokenData.mintAddress,
      // Format prices to more readable values (6 decimal places max)
      price: Number(tokenData.price.toFixed(6)),
      price1d: Number(tokenData.price1d.toFixed(6)),
      price7d: Number(tokenData.price7d.toFixed(6)),
      priceChange24h: Number(((tokenData.price / tokenData.price1d - 1) * 100).toFixed(2)),
      priceChange7d: Number(((tokenData.price / tokenData.price7d - 1) * 100).toFixed(2)),
      decimal: tokenData.decimal,
      logoUrl: tokenData.logoUrl,
      category: tokenData.category || 'Uncategorized',
      subcategory: tokenData.subcategory || 'Uncategorized',
      verified: tokenData.verified,
      updateTime: new Date(tokenData.updateTime * 1000).toISOString(),
      // Format large numbers for readability
      currentSupply: Number(tokenData.currentSupply.toFixed(2)).toLocaleString(),
      marketCap: Number(tokenData.marketCap.toFixed(2)).toLocaleString(),
      // Handle volume data
      volume24h: {
        tokenAmount: tokenData.tokenAmountVolume24h ?
          Number(tokenData.tokenAmountVolume24h.toFixed(2)).toLocaleString() : 0,
        usdValue: tokenData.usdValueVolume24h ?
          Number(tokenData.usdValueVolume24h.toFixed(2)).toLocaleString() : 0
      }
    };
  } catch (error) {
    console.error('Error fetching token details:', error);
    throw error;
  }
}


/**
 * Gets the top token holders for a specific token
 * @param {string} mintAddress - The token's mint address
 * @param {number} limit - Maximum number of holders to return
 * @returns {Object} Formatted top holders data
 */
export async function getTopTokenHolders(mintAddress, limit = 10) {
  try {

    // Fetch top holders data
    const response = await vybeApi.get_top_holders({
      limit: limit,
      mintAddress: mintAddress
    });

    // Calculate total balance and value of top holders
    const totalHoldersBalance = response.data.data.reduce((sum, holder) =>
      sum + parseFloat(holder.balance), 0);

    const totalHoldersValue = response.data.data.reduce((sum, holder) =>
      sum + parseFloat(holder.valueUsd), 0);

    // Map holders to a cleaner format
    const holders = response.data.data.map(holder => {
      return {
        rank: holder.rank,
        address: holder.ownerAddress,
        // Use holder name if available, otherwise use shortened address
        name: holder.ownerName || `${holder.ownerAddress.substring(0, 4)}...${holder.ownerAddress.substring(holder.ownerAddress.length - 4)}`,
        logoUrl: holder.ownerLogoUrl,
        // Format token data
        token: {
          mint: holder.tokenMint,
          symbol: holder.tokenSymbol,
          logoUrl: holder.tokenLogoUrl
        },
        // Format numbers for readability
        balance: {
          raw: parseFloat(holder.balance),
          formatted: Number(parseFloat(holder.balance).toFixed(2)).toLocaleString()
        },
        value: {
          usd: parseFloat(holder.valueUsd),
          formatted: `$${Number(parseFloat(holder.valueUsd).toFixed(2)).toLocaleString()}`
        },
        // Format percentage with 2 decimal places
        percentageOfSupply: Number(holder.percentageOfSupplyHeld.toFixed(2)),
        // Calculate percentage of top holders total
        percentageOfTopHolders: Number(((parseFloat(holder.balance) / totalHoldersBalance) * 100).toFixed(2))
      };
    });

    return {
      tokenMint: mintAddress,
      tokenSymbol: holders[0]?.token.symbol || '',
      totalHolders: limit,
      summary: {
        totalBalance: {
          raw: totalHoldersBalance,
          formatted: Number(totalHoldersBalance.toFixed(2)).toLocaleString()
        },
        totalValue: {
          usd: totalHoldersValue,
          formatted: `$${Number(totalHoldersValue.toFixed(2)).toLocaleString()}`
        },
        // Calculate percentage of supply held by top holders
        percentageOfSupplyHeld: Number((holders.reduce((sum, holder) =>
          sum + holder.percentageOfSupply, 0)).toFixed(2))
      },
      holders: holders
    };
  } catch (error) {
    console.error('Error fetching top token holders:', error);
    throw error;
  }
}


/**
 * Gets the token's OHLC for a specific token
 * @param {string} mintAddress - The token's mint address
 * @param {number} resolution - Resolution of the data
 */
export async function getTokenChart(mintAddress, resolution: "1d" | "1w" | "1h" = '1d') {
  try {
    const response = await vybeApi.get_token_trade_ohlc({
      resolution: resolution,
      mintAddress: mintAddress
    })

    //console.log("generateChartImage call:", response.data)
    const imagePath = await generateChartImage(response.data.data)
    return imagePath
  } catch (error) {
    console.error('Error fetching top token holders:', error);
    throw error;
  }
}

export async function getKnownProgramAccounts() {
  try {
    // Fetch known program accounts data
    const response = await vybeApi.get_known_program_accounts();

    // Return the data directly
    return response.data;
  } catch (error) {
    console.error('Error fetching known program accounts:', error);
    throw error;
  }
}

interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
}

export async function getCryptoMarketNews(category = "crypto", limit = 7) {
  try {
    // API configuration
    const API_KEY = process.env.FINHUB_API_KEY; // Get API key from environment variables for security
    const baseUrl = `https://finnhub.io/api/v1/news?category=${category}&minId=10&token=${API_KEY}`; // Replace with actual news API URL

    // Make the API request
    const response = await fetch(baseUrl, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`News API error: ${response.status} ${response.statusText}`);
    }

    // Parse the response and assert type
    const newsData = await response.json() as NewsArticle[];

    // Process and format the news data, limiting to 7 articles
    const formattedNews = newsData.slice(0, limit).map(article => ({
      id: article.id,
      headline: article.headline,
      summary: article.summary,
      category: article.category,
      source: article.source,
      url: article.url,
      image: article.image,
      datetime: article.datetime,
      // Format datetime as readable string
      date: new Date(article.datetime * 1000).toLocaleString(),
      // Create a shorter summary for display purposes
      shortSummary: article.summary?.length > 100
        ? `${article.summary.substring(0, 97)}...`
        : article.summary
    }));

    console.log(`Fetched ${formattedNews.length} ${category} news articles`);
    return formattedNews;
  } catch (error) {
    console.error("Error fetching crypto market news:", error);
    throw error;
  }
}
