import { Bot, GrammyError, HttpError, Context, InputMediaBuilder } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import "dotenv/config";
import { getWalletTokens, getWalletNFTs, getTokensSummary, getWalletPnL, getTokenDetails, getTopTokenHolders, getTokenChart, getTokenHoldersTimeSeries, getTokenTransfers, getKnownProgramAccounts, getCryptoMarketNews, getGlobalMarketStatus } from "./apis/utils";
import { generateCryptoMotivation, roastWalletPerformance } from "./apis/prompt";
import fs from "fs";
import { InputFile } from "grammy";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// State to track if the user is expected to send a wallet address
const awaitingWalletAddress = new Set<number>();

export function startBot() {
  const token = process.env.BOT_API_KEY;
  const bot = new Bot(token);

  // Define command handlers in one central object
  const commandHandlers = {

    // New commands
    async tb(ctx: Context, walletAddress?: string) {
      // https://docs.vybenetwork.com/reference/get_wallet_tokens
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a wallet address");
      }
      // Use provided mintAddress or get from ctx.match
      const address = walletAddress || ctx.match;

      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a wallet address to scan", { parse_mode: "Markdown" });
      }

      console.log(`token-balance | username: ${username}, address: ${address}`);
      try {
        // Show typing indicator while processing
        await ctx.api.sendChatAction(ctx.chat!.id, "typing");

        // Get wallet data
        const walletData = await getWalletTokens(address);

        // Format the total value with commas and 2 decimal places
        const formattedTotal = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(parseFloat(walletData.totalValueUsd));

        // Generate emoji based on portfolio value
        let emoji = "🚀"; // Default
        if (parseFloat(walletData.totalValueUsd) > 100000) {
          emoji = "💎🙌";
        } else if (parseFloat(walletData.totalValueUsd) > 10000) {
          emoji = "🔥";
        }

        // Create message header
        let message = `${emoji} *WALLET REPORT* ${emoji}\n\n`;
        message += `💰 *Total Value:* $${formattedTotal}\n`;
        message += `🔢 *Token Count:* ${walletData.tokenCount}\n\n`;

        // Sort tokens by value (highest first)
        const sortedTokens = [...walletData.tokens].sort((a, b) =>
          parseFloat(b.valueUsd) - parseFloat(a.valueUsd)
        );

        // Add token details
        message += "*Token Breakdown:*\n";
        sortedTokens.forEach((token, index) => {
          // Format the USD value
          const valueFormatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(parseFloat(token.valueUsd));

          // Add token emojis based on type
          let tokenEmoji = "🪙";
          if (token.symbol === "SOL") tokenEmoji = "⚡";
          if (token.symbol === "USDC" || token.symbol === "USDT") tokenEmoji = "💵";
          if (parseFloat(token.valueUsd) > 10000) tokenEmoji = "🌕"; // Moon emoji for high value tokens

          message += `${tokenEmoji} *${token.symbol}* - $${valueFormatted}\n`;
        });

        // Add footer with wallet address preview
        const shortAddress = `${address}`;
        message += `\n🔍 Address: \`${shortAddress}\`\n`;
        message += `🔗 [View on Solana Explorer](https://explorer.solana.com/address/${address})\n\n`;

        message += `*💡 Quick Actions*\n`;
        const keyboard = new InlineKeyboard()
          .text("🎨 NFTs", `nb_${address}`)
          .text("📊 PnL", `pnl_${address}`)
          .text("💀 Roast", `roast_${address}`)

        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });

      } catch (error) {
        console.error('Failed to send wallet report:', error);
        await ctx.reply("⚠️ Failed to fetch wallet data. Please check the address and try again.");
      }
      // To repsone message part here
    },

    async nb(ctx: Context, walletAddress?: string) {
      // https://docs.vybenetwork.com/reference/get_wallet_nfts
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      // Use provided mintAddress or get from ctx.match
      const address = walletAddress || ctx.match;

      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a wallet address to scan", { parse_mode: "Markdown" });
      }

      console.log(`nft-balance | username: ${username}, address: ${address}`);

      try {
        const nftData = await getWalletNFTs(address);

        // Format values
        const formatValue = (value: number) => {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value);
        };

        // Create cyberpunk-themed message
        let message = `*🎨 NFT COLLECTION SCAN* 🎨\n\n`;
        message += `*Wallet:* \`${address}\`\n`;
        message += `🔗 [View on Solana Explorer](https://explorer.solana.com/address/${address})\n\n`;
        message += `*📊 Collection Summary*\n`;
        message += `💰 *Total Value:* $${formatValue(nftData.summary.totalValueUsd)}\n`;
        message += `⚡ *Total Value (SOL):* ${formatValue(nftData.summary.totalValueSol)}\n`;
        message += `📦 *Collections:* ${nftData.summary.collectionCount}\n`;
        message += `🖼️ *Total NFTs:* ${nftData.summary.totalNftCount}\n\n`;

        message += `*🌟 Top Collections*\n\n`;
        nftData.collections.slice(0, 5).forEach((collection, index) => {
          message += `*${index + 1}. ${collection.name}*\n`;
          message += `📍 Collection: \`${collection.collectionAddress}\`\n`;
          message += `🔗 [View Collection](https://explorer.solana.com/address/${collection.collectionAddress})\n`;
          message += `📦 Items: ${collection.itemCount}\n`;
          message += `💰 Value: $${formatValue(collection.valueUsd)}\n`;
          message += `⚡ Price (SOL): ${formatValue(collection.priceSol)}\n\n`;
        });

        message += `*💡 Quick Actions*\n`;
        const keyboard = new InlineKeyboard()
          .text("💰 Balance", `tb_${address}`)
          .text("📊 PnL", `pnl_${address}`)
          .text("💀 Roast", `roast_${address}`)

        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });

      } catch (error) {
        console.error('Error fetching NFT data:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to scan NFT collection. Please try again later.", { parse_mode: "Markdown" });
      }
    },

    async pnl(ctx: Context, walletAddress?: string) {
      // https://docs.vybenetwork.com/reference/get_wallet_pnl
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;

      // Use provided mintAddress or get from ctx.match
      const address = walletAddress || ctx.match;
      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a wallet address to scan", { parse_mode: "Markdown" });
      }
      console.log(`PnL | username: ${username}, address: ${address}`);

      try {
        const pnlData = await getWalletPnL(address);

        // Format the PnL values
        const formatValue = (value: number) => {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value);
        };

        // Generate performance emoji
        let performanceEmoji = "📊";
        if (pnlData.summary.totalPnlUsd > 0) {
          performanceEmoji = "🚀";
        } else if (pnlData.summary.totalPnlUsd < 0) {
          performanceEmoji = "📉";
        }

        // Create cyberpunk-themed message
        let message = `*🔮 PROFIT & LOSS ANALYSIS* 🔮\n\n`;
        message += `*Wallet:* \`${walletAddress}\`\n\n`;
        message += `*${performanceEmoji} Performance Metrics ${performanceEmoji}*\n`;
        message += `💰 *Total PnL:* $${formatValue(pnlData.summary.totalPnlUsd)}\n`;
        message += `📈 *Realized PnL:* $${formatValue(pnlData.summary.realizedPnlUsd)}\n`;
        message += `📊 *Unrealized PnL:* $${formatValue(pnlData.summary.unrealizedPnlUsd)}\n`;
        message += `🎯 *Win Rate:* ${pnlData.summary.winRate}%\n\n`;

        message += `*⚡ Trading Activity ⚡*\n`;
        message += `🔄 *Total Trades:* ${pnlData.summary.tradesCount}\n`;
        message += `✅ *Winning Trades:* ${pnlData.summary.winningTradesCount}\n`;
        message += `❌ *Losing Trades:* ${pnlData.summary.losingTradesCount}\n`;
        message += `💵 *Average Trade:* $${formatValue(pnlData.summary.averageTradeUsd)}\n\n`;

        // Add best and worst performing tokens
        if (pnlData.summary.bestPerformingToken) {
          message += `*🌟 Best Performer*\n`;
          message += `Token: ${pnlData.summary.bestPerformingToken.symbol}\n`;
          message += `PnL: $${formatValue(pnlData.summary.bestPerformingToken.pnlUsd)}\n\n`;
        }

        if (pnlData.summary.worstPerformingToken) {
          message += `*💀 Worst Performer*\n`;
          message += `Token: ${pnlData.summary.worstPerformingToken.symbol}\n`;
          message += `PnL: $${formatValue(pnlData.summary.worstPerformingToken.pnlUsd)}\n`;
        }

        message += `*💡 Quick Actions*\n`;
        const keyboard = new InlineKeyboard()
          .text("💰 Balance", `tb_${address}`)
          .text("🎨 NFTs", `nb_${address}`)
          .text("💀 Roast", `roast_${address}`)

        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });

      } catch (error) {
        console.error('Error fetching PnL data:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to analyze wallet performance. Please try again later.", { parse_mode: "Markdown" });
      }
    },

    async tokens(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_tokens_summary
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      console.log(`token list | username: ${username}`);

      try {
        const tokenData = await getTokensSummary();

        // Create cyberpunk-themed message
        let message = `*🌌 TOP TOKENS IN THE MATRIX 🌌*\n\n`;
        message += `*Total Tokens Tracked:* ${tokenData.count}\n\n`;
        message += `*🚀 Trending Tokens 🚀*\n\n`;

        // Add top 10 tokens
        tokenData.tokens.slice(0, 10).forEach((token, index) => {
          // Format price values
          const price = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
          }).format(token.price);

          // Calculate 24h price change
          const priceChange24h = ((token.price / token.price1d - 1) * 100).toFixed(2);

          // Generate emoji based on price change
          let changeEmoji = "📊";
          if (parseFloat(priceChange24h) > 0) {
            changeEmoji = "🚀";
          } else if (parseFloat(priceChange24h) < 0) {
            changeEmoji = "📉";
          }

          message += `*${index + 1}. ${token.symbol}*\n`;
          message += `💵 Price: $${price}\n`;
          message += `${changeEmoji} 24h Change: ${priceChange24h}%\n`;
          message += `📊 Volume: $${token.usdValueVolume24h}\n`;
          message += `💰 Market Cap: $${token.marketCap}\n\n`;
        });

        message += `*💡 Use /s [token] to get detailed analysis*\n`;
        message += `*📈 Use /c [token] to view price charts*`;

        await ctx.reply(message, { parse_mode: "Markdown" });
      } catch (error) {
        console.error('Error fetching token data:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to fetch token data. Please try again later.", { parse_mode: "Markdown" });
      }
    },

    async s(ctx: Context, mintAddress?: string) {
      // https://docs.vybenetwork.com/reference/get_token_details
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;

      // Use provided mintAddress or get from ctx.match
      const address = mintAddress || ctx.match;

      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a token address to scan", { parse_mode: "Markdown" });
      }

      console.log(`token search | username: ${username}, mint address: ${address}`);

      try {
        const tokenData = await getTokenDetails(address);

        // Format values
        const formatValue = (value: number) => {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
          }).format(value);
        };

        // Calculate price changes
        const priceChange24h = ((tokenData.price / tokenData.price1d - 1) * 100).toFixed(2);
        const priceChange7d = ((tokenData.price / tokenData.price7d - 1) * 100).toFixed(2);

        // Create cyberpunk-themed message
        let message = `*🔍 TOKEN ANALYSIS* 🔍\n\n`;
        message += `*${tokenData.symbol} (${tokenData.name})*\n`;
        message += `📍 Mint: \`${tokenData.mintAddress}\`\n`;
        message += `🔗 [View on Solana Explorer](https://explorer.solana.com/address/${tokenData.mintAddress})\n\n`;

        message += `*📊 Price Metrics*\n`;
        message += `💰 *Current Price:* $${formatValue(tokenData.price)}\n`;
        message += `📈 *24h Change:* ${priceChange24h}%\n`;
        message += `📊 *7d Change:* ${priceChange7d}%\n\n`;

        message += `*📈 Market Data*\n`;
        message += `💎 *Market Cap:* $${tokenData.marketCap}\n`;
        message += `🔄 *24h Volume:* $${tokenData.volume24h.usdValue}\n`;
        message += `📦 *Supply:* ${tokenData.currentSupply}\n\n`;

        message += `*ℹ️ Token Info*\n`;
        message += `🔢 *Decimals:* ${tokenData.decimal}\n`;
        message += `✅ *Verified:* ${tokenData.verified ? 'Yes' : 'No'}\n\n`;

        message += `*💡 Quick Actions*\n`;

        // Create inline keyboard with whale button
        const keyboard = new InlineKeyboard()
          .text("🐋 Check Whales", `whale_${mintAddress}`)
          .text("📊 Chart", `c_${mintAddress}`);

        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('Error fetching token details:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to analyze token. Please try again later.", { parse_mode: "Markdown" });
      }
    },

    async tt(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_token_transfers
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please send a mint address");
      }
      const mintAddress: any = ctx.match; // takes mint address

      console.log(`token-transfers | username: ${username}, mint address: ${mintAddress}`);

      try {
        // Fetch token transfer data
        const transferData = await getTokenTransfers(mintAddress);

        // Create message header
        let message = `🔄 *Token Transfers for ${mintAddress}*\n\n`;
        message += `📊 *Total Transfers:* ${transferData.count}\n\n`;

        // Add transfer details, limit to first 10 transfers
        transferData.transfers.slice(0, 10).forEach((transfer, index) => {
          message += `*Transfer ${index + 1}:*\n`;
          message += `Signature: ${transfer.signature}\n`;
          message += `From: ${transfer.from}\n`;
          message += `To: ${transfer.to}\n`;
          message += `Amount: ${transfer.amount}\n`;
          message += `Value (USD): $${transfer.valueUsd}\n`;
          message += `Timestamp: ${transfer.timestamp}\n\n`;
        });

        // Send the message with Markdown formatting
        await ctx.reply(message, { parse_mode: "Markdown" });

      } catch (error) {
        console.error('Failed to send token transfer data:', error);
        await ctx.reply("⚠️ Failed to fetch token transfer data. Please check the mint address and try again.");
      }
    },

    async ths(ctx: Context) {
      // Show typing indicator while processing
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please send a mint address");
      }
      const mintAddress: any = ctx.match; // takes mint address

      console.log(`token-holders-series | username: ${username}, mint address: ${mintAddress}`);

      try {
        // Fetch token holders time series data
        const timeSeriesData = await getTokenHoldersTimeSeries(mintAddress);

        // Create message header

        let message = `📈 *Token Holders Time Series for ${mintAddress}*\n\n`;

        // Add time series details
        timeSeriesData.slice(0, 10).forEach((entry, index) => {
          const date = new Date(entry.holdersTimestamp * 1000).toISOString().split('T')[0];
          message += `*Entry ${index + 1}:*\n`;
          message += `Date: ${date}\n`;
          message += `Holders: ${entry.nHolders}\n\n`;

        });

        // Send the message with Markdown formatting
        await ctx.reply(message, { parse_mode: "Markdown" });

      } catch (error) {
        console.error('Failed to send token holders time series data:', error);
        await ctx.reply("⚠️ Failed to fetch token holders time series data. Please check the mint address and try again.");
      }
    },


    async whale(ctx: Context, mintAddress?: string) {
      // https://docs.vybenetwork.com/reference/get_top_holders
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;

      // Use provided mintAddress or get from ctx.match
      const address = mintAddress || ctx.match;

      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a token address to scan", { parse_mode: "Markdown" });
      }

      console.log(`whale | username: ${username}, mint address: ${address}`);

      try {
        const whaleData = await getTopTokenHolders(address);

        // Format values
        const formatValue = (value: number) => {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value);
        };

        // Create cyberpunk-themed message
        let message = `*🐋 WHALE WATCH* 🐋\n\n`;
        message += `*Token:* ${whaleData.tokenSymbol}\n`;
        message += `📍 Mint: \`${whaleData.tokenMint}\`\n`;
        message += `🔗 [View on Solana Explorer](https://explorer.solana.com/address/${whaleData.tokenMint})\n\n`;

        message += `*📊 Top Holders Summary*\n`;
        message += `💰 *Total Value:* $${formatValue(whaleData.summary.totalValue.usd)}\n`;
        message += `📦 *Total Balance:* ${formatValue(whaleData.summary.totalBalance.raw)}\n`;
        message += `📊 *Supply Held:* ${whaleData.summary.percentageOfSupplyHeld}%\n\n`;

        message += `*🏆 Top 5 Holders*\n\n`;
        whaleData.holders.slice(0, 5).forEach((holder, index) => {
          message += `*${index + 1}. ${holder.name}*\n`;
          message += `📍 Address: \`${holder.address}\`\n`;
          message += `🔗 [View Wallet](https://explorer.solana.com/address/${holder.address})\n`;
          message += `💰 Value: $${formatValue(holder.value.usd)}\n`;
          message += `📦 Balance: ${formatValue(holder.balance.raw)}\n`;
          message += `📊 Supply %: ${holder.percentageOfSupply}%\n\n`;
        });

        message += `*💡 Quick Actions*\n`;

        // Create inline keyboard with whale button
        const keyboard = new InlineKeyboard()
          .text("🪙 Token Info", `s_${mintAddress}`)
          .text("📊 Chart", `c_${mintAddress}`);

        await ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('Error fetching whale data:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to scan top holders. Please try again later.", { parse_mode: "Markdown" });
      }
    },

    async c(ctx: Context, mintAddress?: string) {
      //https://docs.vybenetwork.com/reference/get_token_trade_ohlc
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a CA or Mint Address");
      }
      // Use provided mintAddress or get from ctx.match
      const address = mintAddress || ctx.match;
      if (!address) {
        return ctx.reply("⚠️ *NEURAL NETWORK ERROR*\nPlease provide a token address to scan", { parse_mode: "Markdown" });
      }
      console.log(`charts | username: ${username}, mint address: ${address}`);

      try {
        const imagePath = await getTokenChart(address);

        let message = `📍 Mint: \`${address}\`\n`;
        message += `🔗 [View on Solana Explorer](https://explorer.solana.com/address/${address})\n`;
        message += `*💡 Quick Actions*\n`;

        // Create inline keyboard with whale button
        const keyboard = new InlineKeyboard()
          .text("🪙 Token Info", `s_${address}`)
          .text("🐋 Check Whales", `whale_${address}`);


        await ctx.replyWithPhoto(new InputFile(imagePath), {
          caption: message,
          parse_mode: "Markdown",
          reply_markup: keyboard
        });

        // Clean up the temporary file
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error generating chart:', error);
        await ctx.reply('Sorry, there was an error generating the chart. Please try again later.');
      }
    },

    async roast(ctx: Context, walletAddress?: string) {
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      // Use provided mintAddress or get from ctx.match
      const address = walletAddress || ctx.match;

      if (!address) {
        return ctx.reply("⚠️ <b>NEURAL NETWORK ERROR</b>\nPlease provide a wallet address to scan", { parse_mode: "HTML" });
      }

      console.log(`PnL | username: ${username}, address: ${address}`);
      console.log(`roast | username: ${username}, mint address: ${address}`);

      try {
        const roast = await roastWalletPerformance(address);

        let message = `🔥 <b>WALLET ROAST ANALYSIS</b> 🔥\n\n`;
        message += `Target: <code>${address}</code>\n`;
        message += `🔗 <a href="https://explorer.solana.com/address/${address}">View on Solana Explorer</a>\n\n`;
        message += `💀 <b>Brutal Analysis</b>\n`;
        message += `<tg-spoiler>${roast}</tg-spoiler>\n\n`;
        message += `💡 <b>Quick Actions</b>`;

        const keyboard = new InlineKeyboard()
          .text("💰 Balance", `tb_${address}`)
          .text("🎨 NFTs", `nb_${address}`)
          .text("📊 PnL", `pnl_${address}`);

        await ctx.reply(message, {
          parse_mode: "HTML",
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('Error while roasting:', error);
        await ctx.reply("⚠️ <b>SYSTEM MALFUNCTION</b>\nFailed to generate roast. Please try again later.", { parse_mode: "HTML" });
      }
    },

    async markets(ctx: Context) {
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      try {
        // Send "typing" action to indicate the bot is processing
        await ctx.api.sendChatAction(ctx.chat!.id, "typing");
        const marketStatusMessage = await getGlobalMarketStatus();
        // Send the formatted message to the Telegram chat
        await ctx.reply(marketStatusMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error("Error handling markets command:", error);
        await ctx.reply("Sorry, I couldn't retrieve market status information at this time.");
      }

    },

    async news(ctx: Context) {
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      /**
       * Format date string to a cleaner format
       * @param dateStr Original date string
       * @returns Formatted date string
       */
      function formatDate(dateStr: string): string {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          return dateStr; // Return original if parsing fails
        }
      }
      try {
        // Fetch both news types simultaneously
        const [generalNews, cryptoNews] = await Promise.all([
          getCryptoMarketNews("general", 3), // Reduced to 3 for better readability
          getCryptoMarketNews("crypto", 3)   // Reduced to 3 for better readability
        ]);

        // Create minimalist but structured message
        let message = `*📊 MARKET NEWS*\n\n`;

        // General Market News Section
        message += `*GLOBAL MARKETS*\n`;

        generalNews.forEach((article, index) => {
          const isLast = index === generalNews.length - 1;
          const prefix = isLast ? '└' : '├';

          message += `${prefix} *${article.headline}*\n`;
          if (!isLast) {
            message += ` ├ ${formatDate(article.date)}\n`;
            message += ` ├ ${article.shortSummary}\n`;
            message += ` └ [Source: ${article.source}](${article.url})\n\n`;
          } else {
            message += ` ├ ${formatDate(article.date)}\n`;
            message += ` ├ ${article.shortSummary}\n`;
            message += ` └ [Source: ${article.source}](${article.url})\n\n`;
          }
        });

        // Crypto News Section
        message += `*CRYPTO MARKETS*\n`;

        cryptoNews.forEach((article, index) => {
          const isLast = index === cryptoNews.length - 1;
          const prefix = isLast ? '└' : '├';

          message += `${prefix} *${article.headline}*\n`;
          if (!isLast) {
            message += ` ├ ${formatDate(article.date)}\n`;
            message += ` ├ ${article.shortSummary}\n`;
            message += ` └ [Source: ${article.source}](${article.url})\n\n`;
          } else {
            message += ` ├ ${formatDate(article.date)}\n`;
            message += ` ├ ${article.shortSummary}\n`;
            message += ` └ [Source: ${article.source}](${article.url})\n\n`;
          }
        });

        await ctx.reply(message, { parse_mode: "Markdown" });
      } catch (error) {
        console.error('Error fetching news:', error);
        await ctx.reply("*ERROR*\nCould not retrieve market news. Try again later.", { parse_mode: "Markdown" });
      }
    },

    async motivate(ctx: Context) {
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      try {
        const motivate = await generateCryptoMotivation();

        // Create cyberpunk-themed message
        let message = `*🔥  MOTIVATION* 🔥\n\n`;
        message += `*  \`${motivate}\` * \n`;
        await ctx.reply(message, {
          parse_mode: "Markdown",
        });


      } catch (error) {
        console.error('Error while motivating:', error);
        await ctx.reply("⚠️ *SYSTEM MALFUNCTION*\nFailed to generate motivate. Please try again later.", { parse_mode: "Markdown" });
      }


    },

    async help(ctx) {
      const message = `🌌 <b>VYBGEN COMMAND MATRIX </b> 🌌\n\n` +
        `💰 <b>Wallet Analysis</b>\n` +
        `<blockquote expandable>` +
        `/tb [address] - Token balance scan\n` +
        `/nb [address] - NFT collection analysis\n` +
        `/pnl [address] - Profit & loss metrics\n` +
        `/portfolio - Manage your digital assets\n` +
        `</blockquote>\n\n` +

        `🔍 <b>Token Research</b>\n` +
        `<blockquote expandable>` +
        `/s [mint] - Token deep dive\n` +
        `/whale [mint] - Top holders analysis\n` +
        `/c [mint] - Price chart visualization\n` +
        `</blockquote>\n\n` +

        `🧩 <b>Program Analysis</b>\n` +
        `<blockquote expandable>` +
        `/program - Discover programs\n` +
        `/program [address] - Program details\n` +
        `</blockquote>\n\n` +

        `💃🏼 <b>Fun & News</b>\n` +
        `<blockquote expandable>` +
        `/roast [address] - Roast addresses\n` +
        `/markets - View Global Market Status\n` +
        `/news - Get update on global market and crypto news\n` +
        `/motivate - Don't give up\n` +
        `</blockquote>\n\n` +

        `💡 <b>Tips</b>\n` +
        `<i>• Use /s to search for tokens\n` +
        `• Use /c to view price charts\n` +
        `• Use /whale to track big players</i>\n\n` +

        `<b>⚠️ System Status: ONLINE</b>\n` +
        `<b>🔋 Power Level: 100%</b>\n` +
        `<b>🌐 Network: Solana Mainnet</b>`;

      await ctx.reply(message, { parse_mode: "HTML" });
    },

    async program(ctx: Context) {
      console.log("program");
      // Show typing indicator while processing
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      try {
        // Fetch known program accounts
        const programData = await getKnownProgramAccounts();

        // Check if a specific programId is provided
        const programId = typeof ctx.match === 'string' ? ctx.match.trim() : null;

        let message = "";

        if (programId) {
          // Find the program with the specified programId
          const program = programData.programs.find(p => p.programId === programId);

          if (program) {
            // Display details for the specific program
            message += `*Program Details:*\n`;
            message += `Name: ${program.name}\n`;
            message += `Entity: ${program.entityName}\n`;
            message += `Labels: ${program.labels.join(", ")}\n`;
            message += `Description: ${program.programDescription}\n`;
            message += `Date Added: ${new Date(program.dateAdded).toISOString().split('T')[0]}\n`;
          } else {
            message = "⚠️ Program not found. Please check the program ID and try again.";
          }
        } else {
          // Display the first 10 programs
          message = `📚 *Known Program Accounts*\n\n`;
          programData.programs.slice(0, 10).forEach((program, index) => {
            message += `*Program ${index + 1}:*\n`;
            message += `Name: ${program.name}\n`;
            message += `Entity: ${program.entityName}\n`;
            message += `Labels: ${program.labels.join(", ")}\n`;
            message += `Description: ${program.programDescription}\n`;
            message += `Date Added: ${new Date(program.dateAdded).toISOString().split('T')[0]}\n\n`;
          });
        }

        // Send the message with Markdown formatting
        await ctx.reply(message, { parse_mode: "Markdown" });

      } catch (error) {
        console.error('Failed to fetch known program accounts:', error);
        await ctx.reply("⚠️ Failed to fetch known program accounts. Please try again later.");
      }
    },

    async portfolio(ctx: Context) {
      console.log("portfolio");
      // Show typing indicator while processing
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      const username = ctx.from.username;

      // Fetch user wallets from Supabase
      const { data: wallets, error } = await supabase
        .from('user_wallets')
        .select('wallet_address')
        .eq('username', username);

      if (error) {
        console.error('Error fetching wallets:', error);
        await ctx.reply("⚠️ Failed to fetch your wallets. Please try again later.");
        return;
      }

      if (!wallets || wallets.length === 0) {
        // If no wallets are stored, ask the user to add one
        await ctx.reply("You have not stored any wallets. Please add a wallet address to your portfolio.", {
          reply_markup: {
            inline_keyboard: [[{ text: "Add Wallet", callback_data: "add_wallet" }]]
          }
        });
      } else {
        try {
          // If wallets are stored, fetch and display their details
          let message = `📊 *Portfolio for ${username}*\n\n`;

          for (const { wallet_address } of wallets) {
            try {
              message += `*Wallet Address:* \`${wallet_address}\`\n`;

              // Fetch and display Net Balance
              const nftData = await getWalletNFTs(wallet_address);
              message += `Net Balance: $${nftData.summary.totalValueUsd}\n`;

              // Fetch and display Total Balance
              const tokenData = await getWalletTokens(wallet_address);
              message += `Total Balance: $${tokenData.totalValueUsd}\n`;

              // Fetch and display Profit and Loss
              const pnlData = await getWalletPnL(wallet_address);
              message += `Profit and Loss: $${pnlData.summary.totalPnlUsd}\n\n`;
            } catch (walletError) {
              console.error(`Error processing wallet ${wallet_address}:`, walletError);
              message += `Error fetching data for this wallet\n\n`;
            }
          }

          // Send the message with Markdown formatting
          await ctx.reply(message, { parse_mode: "Markdown" });
        } catch (portfolioError) {
          console.error('Error creating portfolio message:', portfolioError);
          await ctx.reply("⚠️ Failed to create your portfolio report. Please try again later.");
        }
      }
    }
  };

  // Define mapping between button text and command handlers
  const textToCommandMap = {
    "💰 Check Balance": "balance",
    "🔑 Create Account": "create-account",
    "🔍 Search Token": "s",
    "📊 Portfolio": "portfolio",
    "🐋 Whale Watch": "whale",
    "📈 Charts ": "chart",
    "❓ Help": "help"
  };

  // Create inline keyboard for message buttons
  const mainInlineKeyboard = new InlineKeyboard()
    .text("💰 Check Balance", "balance")
    .text("🔑 Create Account", "create-account")
    .row()
    .text("🔍 Search Token", "s")
    .text("📊 Portfolio", "portfolio")
    .row()
    .text("🐋 Whale Watch", "whale")
    .text("❓ Help", "help");

  // Create regular keyboard for main reply keyboard
  const mainKeyboard = new Keyboard()
    .text("💰 Check Balance")
    .text("🔍 Search Token")
    .row()
    .text("📊 Portfolio")
    .text("🐋 Whale Watch")
    .row()
    .text("❓ Help")
    .resized();

  bot.command("start", async (ctx) => {
    const userName = ctx.from?.first_name || "there";

    const message = `🚀 Welcome to VybGen, ${userName}!\n\n` +
      `I'm your personal Solana blockchain assistant. Here are the main commands you can use:\n\n` +
      `💰 <b>Wallet Analysis</b>\n` +
      `<blockquote expandable>` +
      `/tb [address] - Token balance scan\n` +
      `/nb [address] - NFT collection analysis\n` +
      `/pnl [address] - Profit & loss metrics\n` +
      `/portfolio - Manage your digital assets\n` +
      `</blockquote>\n\n` +

      `🔍 <b>Token Research</b>\n` +
      `<blockquote expandable>` +
      `/s [mint] - Token deep dive\n` +
      `/whale [mint] - Top holders analysis\n` +
      `/c [mint] - Price chart visualization\n` +
      `</blockquote>\n\n` +

      `🧩 <b>Program Analysis</b>\n` +
      `<blockquote expandable>` +
      `/program - Discover programs\n` +
      `/program [address] - Program details\n` +
      `</blockquote>\n\n` +

      `💃🏼 <b>Fun & News</b>\n` +
      `<blockquote expandable>` +
      `/roast [address] - Roast addresses\n` +
      `/markets - View Global Market Status\n` +
      `/news - Get update on global market and crypto news\n` +
      `/motivate - Don't give up\n` +
      `</blockquote>\n\n` +

      `💡 <b>Tips</b>\n` +
      `<i>• Use /s to search for tokens\n` +
      `• Use /c to view price charts\n` +
      `• Use /whale to track big players</i>\n\n` +

      `<b>⚠️ System Status: ONLINE</b>\n` +
      `<b>🔋 Power Level: 100%</b>\n` +
      `<b>🌐 Network: Solana Mainnet</b>`;

    await ctx.reply(message, { parse_mode: "HTML" });
  });

  // Setup callback query handlers for inline buttons
  Object.keys(commandHandlers).forEach(command => {
    // Register callback query handlers
    bot.callbackQuery(command, async (ctx) => {
      await ctx.answerCallbackQuery(); // Answer callback to remove loading state
      return commandHandlers[command](ctx);
    });

    // Register command handlers (/command)
    bot.command(command, (ctx) => commandHandlers[command](ctx));
  });

  // Define this handler ONCE, outside of any command handlers
  bot.callbackQuery("add_wallet", async (ctx) => {
    await ctx.answerCallbackQuery(); // Acknowledge the callback
    await ctx.reply("Please enter your wallet address.");

    // Add the user to the set of users awaiting a wallet address
    awaitingWalletAddress.add(ctx.from.id);
  });

  // Add a handler for the view_portfolio callback
  bot.callbackQuery("view_portfolio", async (ctx) => {
    await ctx.answerCallbackQuery(); // Acknowledge the callback
    // Call the portfolio command handler directly
    await commandHandlers.portfolio(ctx);
  });

  // Register text handlers for keyboard buttons
  Object.keys(textToCommandMap).forEach(buttonText => {
    const command = textToCommandMap[buttonText];
    bot.hears(buttonText, (ctx) => commandHandlers[command](ctx));
  });

  // Listen for messages to capture the wallet address
  bot.on("message:text", async (ctx) => {
    // Only process if we're waiting for a wallet from this user
    if (awaitingWalletAddress.has(ctx.from.id)) {
      const newWalletAddress = ctx.message.text.trim();

      try {
        console.log('Attempting to insert wallet for user:', ctx.from.username);
        console.log('Wallet address:', newWalletAddress);
        // Insert the new wallet address into Supabase
        const { error } = await supabase
          .from('user_wallets')
          .insert([{
            username: ctx.from.username,
            wallet_address: newWalletAddress
          }]);

        if (error) {
          console.error('Error adding wallet:', error);
          await ctx.reply("⚠️ Failed to add your wallet. Please try again later.");
        } else {
          await ctx.reply(`Wallet address \`${newWalletAddress}\` added to your portfolio.`, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [[{ text: "View Portfolio", callback_data: "view_portfolio" }]]
            }
          });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        await ctx.reply("⚠️ An error occurred while saving your wallet. Please try again later.");
      } finally {
        // Remove the user from the awaiting set regardless of outcome
        awaitingWalletAddress.delete(ctx.from.id);
      }
    }
  });

  // Add callback query handler for whale button
  bot.callbackQuery(/^whale_/, async (ctx) => {
    const mintAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.whale(ctx, mintAddress);
  });
  bot.callbackQuery(/^c_/, async (ctx) => {
    const mintAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.c(ctx, mintAddress);
  });
  bot.callbackQuery(/^s_/, async (ctx) => {
    const mintAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.s(ctx, mintAddress);
  });

  bot.callbackQuery(/^tb_/, async (ctx) => {
    const walletAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.tb(ctx, walletAddress);
  });
  bot.callbackQuery(/^nb_/, async (ctx) => {
    const walletAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.nb(ctx, walletAddress);
  });
  bot.callbackQuery(/^pnl_/, async (ctx) => {
    const walletAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.pnl(ctx, walletAddress);
  });
  bot.callbackQuery(/^roast_/, async (ctx) => {
    const walletAddress = ctx.callbackQuery.data.split('_')[1];
    // Call the whale command handler directly
    await commandHandlers.roast(ctx, walletAddress);
  });


  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  // Start the bot
  bot.start();

  // Return bot with stop method for clean shutdown
  return {
    bot,
    stop: () => bot.stop()
  };
}
