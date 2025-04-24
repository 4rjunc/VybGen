# VybGen: Crypto Intelligence Bot for Telegram

VybGen is a powerful Telegram bot that delivers actionable, real-time on-chain analytics directly to crypto communities. Built on Vybe APIs, VybGen brings sophisticated blockchain monitoring capabilities to where degens already gather.

VybGen prioritizes a seamless, intuitive user experience:

### Command Structure

refer to this tg bot's js library : https://grammy.dev/

```
/start - # display commands + buttons to docs, add to group etc. 

APIDONE + TGMESSAGE  /tb [wallet] - token-balance  # https://docs.vybenetwork.com/reference/get_wallet_tokens  # use this address CLabpywE6YA8diKM73C23TTJs95FPmHgM7o35iPFbgJs
APIDONE /nb [wallet]- nft balance # https://docs.vybenetwork.com/reference/get_wallet_nfts # use this address for 3bgWiS5HTvJ8xu8P7q7qLPztZgS6Df5UskCbjntKUS7P
APIDONE /pnl [wallet]- wallet pnl # https://docs.vybenetwork.com/reference/get_wallet_pnl improvse the PnL response by a banner of best/worst trade of last 7 days

APIDONE /tokens - retrives list of token # https://docs.vybenetwork.com/reference/get_tokens_summary

APIDONE /s [mintAddress or ca] - search coin  # https://docs.vybenetwork.com/reference/get_token_details # add a whale button at the bottom of message to call /whale of that token, and another emoji for /tt also chart emoji for /c 
                        # use this contract address EExgnN63UsvaWqnrrP5epwD5y21qUmt9osgZVq98pump

APIDONE /whale [mintAddress or ca] - top token holders - #https://docs.vybenetwork.com/reference/get_top_holders #SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa
APIDONE + TGMESSAGE /c [mintAddress or ca] - chart of token of last 1 day # https://docs.vybenetwork.com/reference/get_token_trade_ohlc and use chart.js   


/tt [mintAddress or ca]- token's transfer # https://docs.vybenetwork.com/reference/get_token_transfers
/ths [mintAddress or ca] - tokens token holders at selected interval for the specified token # https://docs.vybenetwork.com/reference/get_token_holders_time_series

/help                  - Get assistance

/protfolio [wallet_address]  [wallet_address] - this is setting up a portfolio -> store the tg username with wallet address -> when /portfolio isused without wallet adddress check this tg username has already stored the wallets if no ask to add else call the /nb /tb /pnl of all address and structure it  properly and display it


/program  - program lists # https://docs.vybenetwork.com/reference/get_known_program_accounts , # https://docs.vybenetwork.com/reference/ranking
/program [adddress] / [name] # https://docs.vybenetwork.com/reference/get_program 
    # setupa an ai prompt to take the input name and filter out program address from the prompt

# For group
/gpnl [wallet's]- group member's wallet pnl # https://docs.vybenetwork.com/reference/get_wallet_pnl improvse the PnL response by a banner of best/worst trade of last 7 days
                    # in groups the member's wallet can be take from db when they setup their portfolio . leaderboard can also be printed by this 

# translate 
/tldr [reply to a message] # give a summary of chats of last 24hrs 


#fun 
/roast [walletaddress] #roast the wallet's trading history
/crypotmotivation #something like trade more dont loose faith kinda vibe 


# other api functions
/markets #real-time status of major stock markets around the world.
/cryptomarkets #real-status and price of crypto's in USD
/cryptonews #get some lastes crypto news from X or somewhere 
```

### Interactive Features

- **Inline Buttons:** Every message contains context-aware action buttons
- **Customizable Alerts:** Set your threshold for notifications
- **Conversation Mode:** Natural language understanding for flexibility beyond strict commands
- **Visual Data:** Charts and visualizations directly in Telegram messages
- **Group-Friendly:** Works in both private chats and community groups

### User Onboarding

1. **Start:** Simple `/start` command introduces key functions
2. **Guided Setup:** Step-by-step configuration wizard with `/setup`
3. **Templates:** Pre-configured settings for different user types (trader, holder, developer)
4. **Progressive Disclosure:** Basic commands initially, advanced features introduced progressively

## 🛠️ Technical Execution

VybGen is designed for robustness, efficiency, and reliability:

### Architecture

- **Modular Design:** Each feature is self-contained for reliability and easier updates
- **Caching System:** Redis-based caching reduces API calls and improves response times
- **Rate Limiting:** Intelligent throttling prevents API overuse
- **Error Handling:** Graceful fallbacks ensure bot remains functional even when specific APIs are unavailable
- **State Management:** User preferences and alert settings persisted in MongoDB

### Performance Optimizations

- **Batch Processing:** Groups similar requests to reduce API calls
- **Asynchronous Operations:** Non-blocking architecture for fast response times
- **Scheduled Background Jobs:** Pre-fetches common data during off-peak hours
- **Webhook Implementation:** Uses Telegram webhooks for instant message processing

## 📚 Feature Implementation Details

### 1. Whale Alert System
- **API Endpoints:** `/token/transfers`, `/account/known-accounts`
- **Implementation:** 
  - Monitors transfers in real-time with configurable thresholds
  - Labels known wallets for context (exchange, project, VC)
  - Groups related transfers to reduce alert fatigue
  - Provides direct links to block explorers

### 2. Portfolio Tracker
- **API Endpoints:** `/account/token-balance/{ownerAddress}`, `/account/nft-balance/{ownerAddress}`, `/price/{mintAddress}/token-ohlcv`
- **Implementation:**
  - Personalized tracking of wallet holdings
  - Daily value change calculations
  - Periodic summary reports with performance metrics
  - NFT valuations based on floor prices

### 3. Token Analytics Hub
- **API Endpoints:** `/token/{mintAddress}`, `/token/{mintAddress}/top-holders`, `/token/{mintId}/holders-ts`, `/token/{mintId}/transfer-volume`
- **Implementation:**
  - On-demand comprehensive token analysis
  - Historical metrics with visual trend indicators
  - Holder concentration metrics
  - Trading volume breakdowns

### 4. Program Activity Monitor
- **API Endpoints:** `/program/{programID}`, `/program/{programId}/active-users-ts`, `/program/{programId}/instructions-count-ts`
- **Implementation:**
  - Real-time program usage metrics
  - Anomaly detection for unusual activity
  - User adoption trend visualization
  - Comparative analysis between similar protocols

### 5. Market Sentiment Analyzer
- **API Endpoints:** `/price/{mintAddress}/token-ohlcv`, `/token/trades`, `/token/transfers`
- **Implementation:**
  - Buy vs. sell pressure indicators
  - Volume trend analysis
  - Trading pattern recognition
  - Crowd behavior metrics based on transfer patterns

### 6. Liquidity Depth Monitor
- **API Endpoints:** `/price/markets`, `/price/{marketId}/market-ohlcv`
- **Implementation:**
  - Tracks liquidity across different markets
  - Alerts on significant liquidity changes
  - Identifies vulnerable price levels
  - Reports on liquidity migration between venues

### 7. NFT Collection Tracker
- **API Endpoints:** `/account/nft-balance/{ownerAddress}`, `/account/nft-balances`
- **Implementation:**
  - Collection floor tracking
  - Whale activity monitoring in specific collections
  - Trading volume analysis
  - Rarity-based notifications for listed items

### 8. Token Migration Detector
- **API Endpoints:** `/token/transfers`, `/account/token-balance-ts/{ownerAddress}`
- **Implementation:**
  - Identifies patterns suggesting funds moving between ecosystems
  - Tracks large outflows from centralized entities
  - Monitors bridge transactions
  - Reports unusual token migrations

## 🚀 Setup Instructions

### User Setup

1. **Find VybGen on Telegram:**
   - Search for `@VybGenBot` in Telegram
   - Or click this link: [t.me/VybGenBot](https://t.me/VybGenBot)

2. **Initial Configuration:**
   - Send `/start` to begin
   - Follow the guided setup or use `/setup` for detailed configuration
   - Connect wallets for tracking with `/connect [wallet_address]`

3. **Customizing Alerts:**
   - Set price alerts: `/watch SOL > 100`
   - Configure whale thresholds: `/whale BONK 10000`
   - Adjust notification frequency: `/notify hourly`

4. **Group Chat Integration:**
   - Add VybGen to your group
   - Use `/groupsetup` to configure community-wide alerts
   - Set permission levels with `/roles`

### Developer Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vybgen-bot.git
cd vybgen-bot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Telegram Bot Token and Vybe API key

# Run the bot
npm start

# Run in development mode
npm run dev
```

## 📈 Commercial Viability

VybGen is designed for real-world deployment and scaling:

### Target Users
- **Retail Crypto Traders:** Seeking edge with real-time data
- **Community Managers:** Keeping members informed about project metrics
- **Protocol Teams:** Monitoring competitive landscape and own metrics
- **Investment Groups:** Tracking portfolio performance and market movements

### Monetization Potential
- **Freemium Model:** Basic alerts free, advanced features premium
- **Enterprise Tier:** Custom deployment for DAOs and projects
- **API Extension:** Allow users to build custom modules

### Scaling Strategy
- **Infrastructure:** Cloud-based deployment with auto-scaling
- **Database Sharding:** For efficient user preference management
- **Distributed Processing:** For handling high notification volumes
- **Regional Deployment:** To minimize latency worldwide

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Powered by [Vybe APIs](https://docs.vybenetwork.com/docs/overview)
- Special thanks to the Solana and Telegram developer communities
