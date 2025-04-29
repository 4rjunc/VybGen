import { Bot, GrammyError, HttpError, Context, InputMediaBuilder } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import "dotenv/config";
import { getWalletTokens, getWalletNFTs, getTokensSummary, getWalletPnL, getTokenDetails, getTopTokenHolders, getTokenChart, getTokenHoldersTimeSeries, getTokenTransfers, getKnownProgramAccounts } from "./apis/utils";
import { roastWalletPerformance } from "./apis/prompt";
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
          if (parseFloat(token.valueUsd) > 10000) tokenEmoji = "🌕"; // Moon emoji for high value tokens

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

    async roast(ctx: Context) {
      //https://docs.vybenetwork.com/reference/get_token_trade_ohlc
      await ctx.api.sendChatAction(ctx.chat!.id, "typing");
      const username = ctx.from.username;
      if (!ctx.match) {
        return ctx.reply("Please sent a CA or Mint Address");
      }
      const mintAddress: any = ctx.match // takes wallet address
      console.log(`roast | username: ${username}, mint address: ${mintAddress}`);

      try {
        const roast = await roastWalletPerformance(mintAddress);
        await ctx.reply(roast)
      } catch (error) {
        console.error('Error while roasting:', error);
        await ctx.reply('Sorry, there was an error while roasting. Please try again later.');
      }
    },

    async help(ctx) {
      console.log("help");
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

      `*💃 News, Fun and Others:*\n` +
      `/roast [address] - Roast wallets based on PnL\n` +
      `/markets - Get update on news\n\n` +
      `/crypto - Get update on crypto news\n\n` +

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