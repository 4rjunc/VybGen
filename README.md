# VybGen: Crypto Intelligence Bot for Telegram

VybGen is a powerful Telegram bot that delivers actionable, real-time on-chain analytics directly to crypto communities. Built on Vybe APIs, VybGen brings sophisticated blockchain monitoring capabilities to where degens already gather.

![VybGen Logo](assets/vybgen-logo.png)

## 🚀 Innovation & Originality

VybGen leverages Vybe APIs in creative ways to bring unique insights to Telegram users:

### 1. Smart Money Flow Detection
- **What it does:** Identifies and alerts when labeled "smart money" wallets (VCs, founders, treasury) make significant moves
- **How it works:** Combines `/account/known-accounts` with `/token/transfers` to detect patterns and create actionable signals
- **Why it matters:** Get alerted before everyone else when sophisticated players make strategic moves

### 2. Cross-DEX Arbitrage Finder
- **What it does:** Identifies price discrepancies across multiple exchanges and liquidity pools
- **How it works:** Uses `/price/{baseMintAddress}+{quoteMintAddress}/pair-ohlcv` across different program IDs to find tradable gaps
- **Why it matters:** Profit from market inefficiencies before they're arbitraged away

### 3. Protocol Health Radar
- **What it does:** Creates a comprehensive health score for protocols based on multiple data points
- **How it works:** Aggregates data from `/program/{programId}/active-users-ts`, `/program/{programId}/tvl`, and instruction count endpoints
- **Why it matters:** Spot declining protocols before major issues arise or identify growing protocols early

### 4. Whale Behavior Analysis
- **What it does:** Goes beyond simple whale alerts by categorizing and analyzing patterns in large holder behavior
- **How it works:** Combines `/token/{mintAddress}/top-holders` with `/token/transfers` to create behavior profiles
- **Why it matters:** Understand if whales are accumulating, distributing, or repositioning

### 5. Oracle-DEX Divergence Alerts
- **What it does:** Identifies when on-chain trading prices significantly diverge from oracle prices
- **How it works:** Compares `/price/{priceFeedId}/pyth-price` data with actual DEX pricing from `/price/{mintAddress}/token-ohlcv`
- **Why it matters:** Spot market inefficiencies or potential oracle manipulation attempts

## 💯 User Experience

VybGen prioritizes a seamless, intuitive user experience:

### Command Structure

```
/track [wallet]        - Track wallet activities
/price [token]         - Get price data and charts
/watch [token] [condition] [value] - Set price alerts
/whale [token] [amount] - Track large transfers
/health [protocol]     - Get protocol health metrics
/arb                   - View current arbitrage opportunities
/flow                  - See smart money movements
/profile               - View your settings
/help                  - Get assistance
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

## 🛣️ Development Roadmap

- **Phase 1** *(Weeks 1-2)*
  - Core API integration
  - Basic command structure
  - Wallet tracking
  - Price alerts

- **Phase 2** *(Weeks 3-4)*
  - Whale monitoring system
  - Protocol health metrics
  - Smart money tracking
  - Enhanced visualizations

- **Phase 3** *(Weeks 5-6)*
  - Arbitrage detection
  - Pattern recognition
  - Machine learning for signal generation
  - Community features

- **Phase 4** *(Post-Hackathon)*
  - Mobile companion app
  - Custom notification systems
  - Advanced analytics dashboard
  - API for third-party extensions

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Built for the Vybe Telegram Bot Challenge
- Powered by [Vybe APIs](https://vybe.api-docs.io)
- Special thanks to the Solana and Telegram developer communities
