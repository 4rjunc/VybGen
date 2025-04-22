import { Bot, GrammyError, HttpError } from "grammy";
import { InlineKeyboard, Keyboard } from "grammy";
import "dotenv/config";


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
    async tb(ctx) {
      console.log("token-balance");
      // https://docs.vybenetwork.com/reference/get_wallet_tokens
    },

    async nb(ctx) {
      console.log("nft-balance");
      // https://docs.vybenetwork.com/reference/get_wallet_nfts
    },

    async pnl(ctx) {
      console.log("wallet-pnl");
      // https://docs.vybenetwork.com/reference/get_wallet_pnl
    },

    async tokens(ctx) {
      console.log("tokens");
      // https://docs.vybenetwork.com/reference/get_tokens_summary
    },

    async s(ctx) {
      console.log("search-coin");
      // https://docs.vybenetwork.com/reference/get_token_details
    },

    async tt(ctx) {
      console.log("token-transfers");
      // https://docs.vybenetwork.com/reference/get_token_transfers
    },

    async ths(ctx) {
      console.log("token-holders-series");
      // https://docs.vybenetwork.com/reference/get_token_holders_time_series
    },

    async whale(ctx) {
      console.log("top-token-holders");
      // https://docs.vybenetwork.com/reference/get_top_holders
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
