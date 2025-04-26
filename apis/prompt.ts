//together
import "dotenv/config";
import Together from "together-ai";
import { getWalletPnL } from "./utils";

const together = new Together();

/**
 * Retrieves PnL data for a wallet address and generates a humorous roast
 * @param {string} walletAddress - The wallet address to analyze
 * @param {string} resolution - Time resolution for PnL data (default: '7d')
 * @returns {Promise<string>} - A 3-4 line roast of the wallet's trading performance
 */
export async function roastWalletPerformance(walletAddress, resolution = '7d') {
  try {
    // Get the wallet PnL data using the provided function
    const pnlData = await getWalletPnL(walletAddress, resolution);
    const summary = pnlData.summary;

    // Calculate win percentage for better formatting
    const winPercentage = summary.winRate * 100;

    // Create a prompt with key trading metrics
    const roastPrompt = `
      Roast this trader's performance in 3-4 witty lines:
      - Win rate: ${winPercentage}%
      - Total PnL: $${summary.totalPnlUsd}
      - Realized PnL: $${summary.realizedPnlUsd}
      - Unrealized PnL: $${summary.unrealizedPnlUsd}
      - Trades count: ${summary.tradesCount}
      - Winning trades: ${summary.winningTradesCount}
      - Losing trades: ${summary.losingTradesCount}
      - Best token: ${summary.bestPerformingToken ? summary.bestPerformingToken.symbol : 'None'}
      - Worst token: ${summary.worstPerformingToken ? summary.worstPerformingToken.symbol : 'None'}
    `;

    // Generate the roast using the LLM
    const roast = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: "You are a witty AI that creates short, humorous roasts of cryptocurrency trading performance. Be direct, funny, and slightly sarcastic. Focus on the trader's win rate, PnL, and trading choices."
        },
        {
          role: "user",
          content: roastPrompt
        }
      ],
      max_tokens: 150
    });

    if (roast?.choices?.[0]?.message?.content) {
      const roastContent = roast.choices[0].message.content.trim();
      console.log("Generated roast for wallet:", walletAddress);
      return roastContent;
    } else {
      throw new Error("Failed to generate roast");
    }
  } catch (error) {
    console.error("Error roasting wallet performance:", error);
    throw error;
  }
}
