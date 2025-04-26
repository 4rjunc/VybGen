import { Bot, GrammyError, HttpError, Context, InputMediaBuilder } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import "dotenv/config";
import { getWalletTokens, getWalletNFTs, getTokensSummary, getWalletPnL, getTokenDetails, getTopTokenHolders, getTokenChart, getTokenHoldersTimeSeries, getTokenTransfers } from "./apis/utils";
import fs from "fs";
import { InputFile } from "grammy";

// Initialize Supabase client
//const supabaseUrl = process.env.SUPABASE_URL;
//const supabaseKey = process.env.SUPABASE_ANON_KEY;
//const supabase = createClient(supabaseUrl, supabaseKey);


export function startBot() {
  const token = process.env.BOT_API_KEY;
  const bot = new Bot(token);

  // Define command handlers in one central object
  const commandHandlers = {
    // Basic commands kept from original
    async balance(ctx) {
      console.log("balance");
    },

    async "create-account"(ctx) {
      console.log("create-account");
    },

    // New commands
    async tb(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_wallet_tokens
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a wallet address");
      }
      const walletAddress: any = ctx.match // takes wallet address

      console.log(`token-balance | username: ${username}, address: ${walletAddress}`);
      try {
        // Show typing indicator while processing
        await ctx.api.sendChatAction(ctx.chat!.id, "typing");

        // Get wallet data
        const walletData = await getWalletTokens(walletAddress);

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
          if (token.valueUsd > 10000) tokenEmoji = "🌕"; // Moon emoji for high value tokens

          message += `${tokenEmoji} *${token.symbol}* - $${valueFormatted}\n`;
        });

        // Add footer with wallet address preview
        const shortAddress = `${walletAddress}`;
        message += `\n🔍 Address: \`${shortAddress}\``;

        // Send the message with Markdown formatting
        await ctx.reply(message, { parse_mode: "Markdown" });

      } catch (error) {
        console.error('Failed to send wallet report:', error);
        await ctx.reply("⚠️ Failed to fetch wallet data. Please check the address and try again.");
      }
      // To repsone message part here
    },

    async nb(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_wallet_nfts
      // Show typing indicator while processing
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");

      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a wallet address");
      }
      const walletAddress: any = ctx.match // takes wallet address

      console.log(`nft-balance | username: ${username}, address: ${walletAddress}`);

      // use try-catch blocks (good practice usefull while judging)
      getWalletNFTs(walletAddress)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(err => console.error(err));
    },

    async pnl(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_wallet_pnl
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a wallet address");
      }
      const walletAddress: any = ctx.match // takes wallet address

      console.log(`PnL | username: ${username}, address: ${walletAddress}`);

      // use try-catch blocks (good practice usefull while judging)
      getWalletPnL(walletAddress)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(err => console.error(err));


    },

    async tokens(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_tokens_summary
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      console.log(`token list | username: ${username}`);

      // use try-catch blocks (good practice usefull while judging)
      getTokensSummary()
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(err => console.error(err));

    },

    async s(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_token_details
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a CA or Mint Address");
      }
      const mintAddress: any = ctx.match // takes wallet address

      console.log(`token search | username: ${username}, mint address: ${mintAddress}`);

      // use try-catch blocks (good practice usefull while judging)
      getTokenDetails(mintAddress)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(err => console.error(err));
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
          message += `*Transfer ${index + 1}:*
    `;
          message += `Signature: ${transfer.signature}
    `;
          message += `From: ${transfer.from}
    `;
          message += `To: ${transfer.to}
    `;
          message += `Amount: ${transfer.amount}
    `;
          message += `Value (USD): $${transfer.valueUsd}
    `;
          message += `Timestamp: ${transfer.timestamp}
    
    `;
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
            let message = `📈 *Token Holders Time Series for ${mintAddress}*
    
    `;
    
            // Add time series details
            timeSeriesData.slice(0, 10).forEach((entry, index) => {
              const date = new Date(entry.holdersTimestamp * 1000).toISOString().split('T')[0];
              message += `*Entry ${index + 1}:*
    `;
              message += `Date: ${date}
    `;
              message += `Holders: ${entry.nHolders}
    
    `;
            });
    
            // Send the message with Markdown formatting
            await ctx.reply(message, { parse_mode: "Markdown" });
    
          } catch (error) {
            console.error('Failed to send token holders time series data:', error);
            await ctx.reply("⚠️ Failed to fetch token holders time series data. Please check the mint address and try again.");
          }
        },
    
    

    async whale(ctx: Context) {
      // https://docs.vybenetwork.com/reference/get_top_holders
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a CA or Mint Address");
      }
      const mintAddress: any = ctx.match // takes wallet address

      console.log(`whale | username: ${username}, mint address: ${mintAddress}`);

      // use try-catch blocks (good practice usefull while judging)
      getTopTokenHolders(mintAddress)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(err => console.error(err));
    },

    async c(ctx: Context) {
      //https://docs.vybenetwork.com/reference/get_token_trade_ohlc
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a CA or Mint Address");
      }
      const mintAddress: any = ctx.match // takes wallet address
      console.log(`charts | username: ${username}, mint address: ${mintAddress}`);

      try {
        const imagePath = await getTokenChart(mintAddress);
        await ctx.replyWithPhoto(new InputFile(imagePath), {
          caption: `Chart for token: ${mintAddress}`
        });
        
        // Clean up the temporary file
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error generating chart:', error);
        await ctx.reply('Sorry, there was an error generating the chart. Please try again later.');
      }
    },

    async help(ctx) {
      console.log("help");
    },

    async portfolio(ctx) {
      console.log("portfolio");
      // Store the tg username with wallet address
      // When used without wallet address check if username has stored wallets
      // If no, ask to add, else call /nb /tb /pnl of all addresses
    },

    async program(ctx) {
      console.log("program");
      // https://docs.vybenetwork.com/reference/get_known_program_accounts
      // https://docs.vybenetwork.com/reference/ranking
      // For specific address: https://docs.vybenetwork.com/reference/get_program
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

    await ctx.reply(
      `*🚀 Welcome to VybGen, ${userName}!*\n\n` +
      `I'm your personal Solana blockchain assistant. Here are the main commands you can use:\n\n` +
      `*💰 Wallet Commands:*\n` +
      `/tb [wallet] - Token balances\n` +
      `/nb [wallet] - NFT collection\n` +
      `/pnl [wallet] - Profit & loss\n` +
      `/portfolio - Manage wallets\n\n` +

      `*🔍 Token Research:*\n` +
      `/tokens - Browse trending tokens\n` +
      `/s [mintAddress/name] - Search tokens\n` +
      `/tt [mintAddress] - Token transfers\n` +
      `/whale [mintAddress] - Top holders\n\n` +
      `/c [mintAddress] - Generate a Chart\n\n` +


      `*🧩 Program Analysis:*\n` +
      `/program - Discover programs\n` +
      `/program [address/name] - Program details\n\n` +

      `Type /help for a complete list of commands and examples.`,
      {
        parse_mode: "Markdown",
        reply_markup: mainInlineKeyboard
      }
    );
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

  // Register text handlers for keyboard buttons
  Object.keys(textToCommandMap).forEach(buttonText => {
    const command = textToCommandMap[buttonText];
    bot.hears(buttonText, (ctx) => commandHandlers[command](ctx));
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
