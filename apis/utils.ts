import vybeApi from '@api/vybe-api';
import { generateChartImage } from "./chart"
import axios from 'axios';

const vybe_token = process.env.VYBE_TOKEN;
vybeApi.auth(vybe_token);
const API_KEY = process.env.FINHUB_API_KEY; // Get API key from environment variables for security

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
export async function getTokenChart(mintAddress, resolution: "1d" | "7d" | "30d" = '1d') {
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



// Define types for the API response
interface MarketStatusResponse {
  exchange: string;
  holiday: string | null;
  isOpen: boolean;
  session: string;
  timezone: string;
  t: number;
}

// Define country/exchange metadata for display
interface ExchangeInfo {
  code: string;
  name: string;
  flag: string;
  displayName: string;
  timezone: string;
  region: string;
  regionOrder: number;
  mainExchange: boolean;
}

/**
 * Check if current time in the given timezone is within trading hours based on the region
 * and it's a weekday (Monday-Friday)
 * 
 * @param timezone The timezone to check
 * @param exchangeCode Optional exchange code for specific market hours
 * @returns boolean indicating if current time is within trading hours
 */
function isWithinTradingHours(timezone: string, exchangeCode?: string): boolean {
  try {
    // Create formatter for getting hours and minutes in the target timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: timezone
    });

    // Create formatter for getting day of week in the target timezone
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: timezone
    });

    const now = new Date();
    const localTime = timeFormatter.format(now);
    const dayOfWeek = dayFormatter.format(now);

    // Parse the time
    const [hoursStr, minutesStr] = localTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Convert to minutes since midnight
    const currentTimeInMinutes = (hours * 60) + minutes;

    // Check if it's a weekday
    const isWeekday = !['Saturday', 'Sunday'].includes(dayOfWeek);

    if (!isWeekday) {
      return false; // Markets are closed on weekends
    }

    // Define trading hours based on timezone/region or specific exchange
    let marketOpenTime = 9 * 60 + 30;  // Default: 9:30 AM
    let marketCloseTime = 15 * 60 + 30; // Default: 3:30 PM

    // Special cases for specific exchanges
    if (exchangeCode) {
      switch (exchangeCode) {
        case 'US': // US markets: 9:30 AM - 4:00 PM
          marketOpenTime = 9 * 60 + 30;  // 9:30 AM
          marketCloseTime = 16 * 60;     // 4:00 PM
          break;
        case 'T': // Tokyo: 9:00 AM - 3:00 PM
          marketOpenTime = 9 * 60;       // 9:00 AM
          marketCloseTime = 15 * 60;     // 3:00 PM
          break;
        case 'HK': // Hong Kong: 9:30 AM - 4:00 PM
        case 'SS': // Shanghai
        case 'SZ': // Shenzhen
          marketOpenTime = 9 * 60 + 30;  // 9:30 AM
          marketCloseTime = 16 * 60;     // 4:00 PM
          break;
        case 'L': // London: 8:00 AM - 4:30 PM
          marketOpenTime = 8 * 60;       // 8:00 AM
          marketCloseTime = 16 * 60 + 30; // 4:30 PM
          break;
        // Add more specific exchange hours as needed
      }
    }
    // If no specific exchange code or not in the list, use region-based hours
    else if (timezone.includes('America')) {
      marketOpenTime = 9 * 60 + 30;  // 9:30 AM
      marketCloseTime = 16 * 60;     // 4:00 PM
    }
    else if (timezone.includes('Asia')) {
      if (timezone.includes('Tokyo')) {
        marketOpenTime = 9 * 60;     // 9:00 AM
        marketCloseTime = 15 * 60;   // 3:00 PM
      } else {
        marketOpenTime = 9 * 60 + 30; // 9:30 AM
        marketCloseTime = 16 * 60;    // 4:00 PM
      }
    }
    else if (timezone.includes('Europe')) {
      marketOpenTime = 8 * 60;       // 8:00 AM
      marketCloseTime = 16 * 60 + 30; // 4:30 PM
    }
    else if (timezone.includes('Australia')) {
      marketOpenTime = 10 * 60;      // 10:00 AM
      marketCloseTime = 16 * 60;     // 4:00 PM
    }

    // Return true if time is between market hours
    return currentTimeInMinutes >= marketOpenTime &&
      currentTimeInMinutes <= marketCloseTime;
  } catch (error) {
    console.error("Error checking trading hours:", error);
    return false; // Default to closed on error
  }
}

/**
 * Gets global market status for multiple exchanges and formats it for Telegram
 * @returns {Promise<string>} Formatted market status message for Telegram
 */
export async function getGlobalMarketStatus() {
  try {
    // Define exchanges to check with their metadata
    // Selected major exchanges from different regions
    const exchanges: ExchangeInfo[] = [
      // Americas
      { code: 'US', name: 'US exchanges (NYSE, Nasdaq)', flag: '🇺🇸', displayName: 'UNITED STATES', timezone: 'America/New_York', region: 'AMERICAS', regionOrder: 1, mainExchange: true },
      { code: 'TO', name: 'TORONTO STOCK EXCHANGE', flag: '🇨🇦', displayName: 'CANADA', timezone: 'America/Toronto', region: 'AMERICAS', regionOrder: 1, mainExchange: false },
      // Asia-Pacific
      { code: 'T', name: 'TOKYO STOCK EXCHANGE', flag: '🇯🇵', displayName: 'JAPAN', timezone: 'Asia/Tokyo', region: 'ASIA-PACIFIC', regionOrder: 2, mainExchange: true },
      { code: 'SZ', name: 'SHENZHEN STOCK EXCHANGE', flag: '🇨🇳', displayName: 'CHINA (SZ)', timezone: 'Asia/Shanghai', region: 'ASIA-PACIFIC', regionOrder: 2, mainExchange: false },
      { code: 'NS', name: 'NATIONAL STOCK EXCHANGE OF INDIA', flag: '🇮🇳', displayName: 'INDIA (NSE)', timezone: 'Asia/Kolkata', region: 'ASIA-PACIFIC', regionOrder: 2, mainExchange: true },
      { code: 'SI', name: 'SINGAPORE EXCHANGE', flag: '🇸🇬', displayName: 'SINGAPORE', timezone: 'Asia/Singapore', region: 'ASIA-PACIFIC', regionOrder: 2, mainExchange: false },

      // Europe
      { code: 'L', name: 'LONDON STOCK EXCHANGE', flag: '🇬🇧', displayName: 'UK', timezone: 'Europe/London', region: 'EUROPE', regionOrder: 3, mainExchange: true },
      { code: 'DE', name: 'XETRA', flag: '🇩🇪', displayName: 'GERMANY', timezone: 'Europe/Berlin', region: 'EUROPE', regionOrder: 3, mainExchange: true },
      { code: 'SW', name: 'SWISS EXCHANGE', flag: '🇨🇭', displayName: 'SWITZERLAND', timezone: 'Europe/Zurich', region: 'EUROPE', regionOrder: 3, mainExchange: false },

      // Middle East & Africa
      { code: 'TA', name: 'TEL AVIV STOCK EXCHANGE', flag: '🇮🇱', displayName: 'ISRAEL', timezone: 'Asia/Jerusalem', region: 'MIDDLE EAST & AFRICA', regionOrder: 4, mainExchange: false },
      { code: 'JO', name: 'JOHANNESBURG STOCK EXCHANGE', flag: '🇿🇦', displayName: 'SOUTH AFRICA', timezone: 'Africa/Johannesburg', region: 'MIDDLE EAST & AFRICA', regionOrder: 4, mainExchange: false },
      { code: 'DB', name: 'DUBAI FINANCIAL MARKET', flag: '🇦🇪', displayName: 'UAE', timezone: 'Asia/Dubai', region: 'MIDDLE EAST & AFRICA', regionOrder: 4, mainExchange: false }
    ];

    // Fetch market status for all exchanges in parallel
    const marketStatusPromises = exchanges.map(async (exchange) => {
      const url = `https://finnhub.io/api/v1/stock/market-status?exchange=${exchange.code}&token=${API_KEY}`;

      // Modified fetch function with the above trading hours check
      try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
          //console.error(`Error fetching market status for ${exchange.code}: ${response.status}`);

          // Check if the market should be open based on time when API fails
          const isOpenByTime = isWithinTradingHours(exchange.timezone, exchange.code);

          return {
            exchange,
            status: {
              isOpen: isOpenByTime, // Set based on time check
              session: isOpenByTime ? "open" : "closed",
              holiday: null,
              timezone: exchange.timezone,
              t: Math.floor(Date.now() / 1000)
            } as MarketStatusResponse
          };
        }
        const status = await response.json() as MarketStatusResponse;
        return { exchange, status };
      } catch (error) {
        //console.error(`Failed to fetch market status for ${exchange.code}:`, error);

        // Check if the market should be open based on time when there's an error
        const isOpenByTime = isWithinTradingHours(exchange.timezone, exchange.code);

        return {
          exchange,
          status: {
            isOpen: isOpenByTime, // Set based on time check
            session: isOpenByTime ? "open" : "closed",
            holiday: null,
            timezone: exchange.timezone,
            t: Math.floor(Date.now() / 1000)
          } as MarketStatusResponse
        };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(marketStatusPromises);

    // Group results by region
    const regionMap = new Map<string, Array<{ exchange: ExchangeInfo, status: MarketStatusResponse }>>();

    results.forEach((result) => {
      const region = result.exchange.region;
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)?.push(result);
    });

    // Sort regions by order
    const sortedRegions = Array.from(regionMap.entries()).sort((a, b) => {
      const regionOrderA = a[1][0]?.exchange.regionOrder || 0;
      const regionOrderB = b[1][0]?.exchange.regionOrder || 0;
      return regionOrderA - regionOrderB;
    });

    // Current UTC time
    const utcNow = new Date();
    const utcTimeString = utcNow.toISOString().replace('T', ' ').substring(0, 16);

    // Generate formatted message
    let message = `🌐 GLOBAL MARKETS STATUS\n\n`;
    message += `UTC Time: ${utcTimeString} AM\n\n`;

    // Add regions and exchanges to the message
    sortedRegions.forEach(([region, exchangeResults]) => {
      // Add region header with proper emoji
      let regionEmoji = '🌐';
      if (region === 'AMERICAS') regionEmoji = '🌎';
      else if (region === 'ASIA-PACIFIC') regionEmoji = '🌏';
      else if (region === 'EUROPE') regionEmoji = '🇪🇺';
      else if (region === 'MIDDLE EAST & AFRICA') regionEmoji = '🌍';

      // Special formatting for US
      const usResult = exchangeResults.find(r => r.exchange.code === 'US');
      if (region === 'AMERICAS' && usResult) {
        const localTime = getLocalTime(usResult.exchange.timezone);
        const status = getStatusText(usResult.status);
        const tomorrowStatus = predictTomorrowStatus(usResult.status);

        message += `${usResult.exchange.flag} ${usResult.exchange.displayName}\n`;
        message += ` ├ Exchanges: NYSE, NASDAQ\n`;
        message += ` ├ Status: ${status}\n`;
        message += ` ├ Local Time: ${localTime}\n`;
        message += ` └ Tomorrow: ${tomorrowStatus}\n\n`;

        // Filter out US from further processing
        exchangeResults = exchangeResults.filter(r => r.exchange.code !== 'US');
      }

      // Only add region header if there are exchanges to show
      if (exchangeResults.length > 0) {
        message += `${regionEmoji} ${region}\n`;

        // Sort exchanges by mainExchange flag (main exchanges first)
        const sortedExchanges = exchangeResults.sort((a, b) => {
          // First sort by mainExchange (true comes first)
          if (a.exchange.mainExchange && !b.exchange.mainExchange) return -1;
          if (!a.exchange.mainExchange && b.exchange.mainExchange) return 1;
          // Then sort alphabetically by display name
          return a.exchange.displayName.localeCompare(b.exchange.displayName);
        });

        // Add exchanges in this region
        sortedExchanges.forEach((result) => {
          const localTime = getLocalTime(result.exchange.timezone);
          const status = getStatusText(result.status);
          const holidayText = result.status.holiday ? ` (Holiday)` : '';

          message += `${result.exchange.flag} ${result.exchange.displayName}: ${status}${holidayText} (Local: ${localTime})\n`;
        });
        message += '\n';
      }
    });

    return message.trim();
  } catch (error) {
    console.error("Error generating global market status:", error);
    throw error;
  }
}

/**
 * Get formatted local time for a timezone
 * @param timezone Timezone string
 * @returns Formatted time string
 */
function getLocalTime(timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  };

  return new Date().toLocaleString('en-US', options);
}

/**
 * Get human-readable status text based on API response
 * @param status Market status response
 * @returns Formatted status text
 */
function getStatusText(status: MarketStatusResponse): string {
  if (status.holiday) {
    return 'Closed (Holiday)';
  }

  if (status.isOpen) {
    return 'Open';
  }

  if (status.session === 'pre-market') {
    return 'Closed (Pre-market)';
  } else if (status.session === 'post-market' || status.session === 'after-hours') {
    return 'Closed (After-hours)';
  } else if (status.session === 'unknown') {
    return 'Status Unknown';
  }

  return 'Closed';
}

/**
 * Predict tomorrow's market status based on today's status and day of week
 * @param status Current market status
 * @returns Predicted status for tomorrow
 */
function predictTomorrowStatus(status: MarketStatusResponse): string {
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 6 = Saturday

  // If today is Friday or Saturday, the market will be closed tomorrow
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return "Closed";
  }

  // If there's a holiday tomorrow, it would be closed
  if (status.holiday) {
    // This is a simple approximation - we should check if the holiday spans multiple days
    return "Closed (Holiday)";
  }

  // Default assumption: markets open on weekdays
  return "Open";
}



export interface Token {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  currentSupply: number;
  mintAddress: string;
}

export type SortField = 'name' | 'symbol' | 'price' | 'marketCap' | 'currentSupply' | 'mintAddress';
export type SortDirection = 'asc' | 'desc';

/**
 * Fetches tokens from the VYBE API with sorting options
 */
export async function getTopTokens(
  sortBy: SortField = 'marketCap', 
  sortDirection: SortDirection = 'desc',
  limit: number = 10
): Promise<Token[]> {
  try {
    console.log('🔍 Starting getTopTokens with params:', { sortBy, sortDirection, limit });
    
    // Authenticate with the API
    vybeApi.auth(vybe_token);
    console.log('✅ API authentication successful');
    
    // Prepare parameters object
    const params: Record<string, string> = {
      limit: String(limit)
    };
    
    // Add sorting parameter
    if (sortDirection === 'asc') {
      params.sortByAsc = sortBy;
    } else {
      params.sortByDesc = sortBy;
    }
    
    console.log('📤 Making API request with params:', params);
    
    // Make API request
    const response = await vybeApi.get_tokens_summary(params);
    console.log('📥 Received API response:', JSON.stringify(response, null, 2));
    
    if (!response) {
      console.error('❌ No response received from API');
      throw new Error('No response received from API');
    }
    
    if (!response.data || !response.data.data) {
      console.error('❌ No data in API response');
      throw new Error('No data in API response');
    }
    
    if (!Array.isArray(response.data.data)) {
      console.error('❌ Invalid data structure:', typeof response.data.data);
      throw new Error('Invalid API response structure');
    }
    
    console.log(`✅ Successfully received ${response.data.data.length} tokens`);

    // Map API response to Token interface
    const tokens: Token[] = response.data.data.map(token => {
      console.log('🔍 Processing token:', token.symbol);
      return {
        name: token.name || 'Unknown',
        symbol: token.symbol || 'UNKNOWN',
        price: token.price || 0,
        marketCap: token.marketCap || 0,
        currentSupply: token.currentSupply || 0,
        mintAddress: token.mintAddress || '',
      };
    });

    console.log('✅ Successfully processed tokens');
    return tokens;
  } catch (error) {
    console.error('❌ Error in getTopTokens:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw new Error('Failed to fetch tokens from VYBE API');
  }
}