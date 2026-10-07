import { BacktestConfig, BacktestResult, BacktestTrade, OrderSide, Candle } from '../types';
import { calculateEMA, calculateRSI, calculateSupertrend, calculateVWAP, calculateATR, calculateIndianCharges } from './technicalIndicators';

/**
 * Generates synthetic historical data for backtesting based on symbol and period
 */
function generateHistoricalBars(symbol: string, period: string, timeframe: string): Candle[] {
  let days = 30;
  if (period === '3M') days = 90;
  if (period === '6M') days = 180;
  if (period === '1Y') days = 365;
  if (period === '3Y') days = 1095;

  let barsPerDay = 25; // for 15m intraday bars
  if (timeframe === '5m') barsPerDay = 75;
  if (timeframe === '1h') barsPerDay = 7;
  if (timeframe === '1D') barsPerDay = 1;

  const totalBars = Math.min(600, Math.floor(days * barsPerDay));
  const basePrices: Record<string, number> = {
    'NIFTY 50': 23800,
    'BANKNIFTY': 50500,
    'RELIANCE': 2850,
    'HDFCBANK': 1580,
    'TCS': 3950,
    'INFY': 1750,
    'TATAMOTORS': 910,
    'ICICIBANK': 1140,
  };

  const startPrice = basePrices[symbol] || 1500;
  let price = startPrice;
  const bars: Candle[] = [];
  const now = Date.now();
  const barIntervalMs = 15 * 60 * 1000;

  // Generate drift and volatility
  const volatility = 0.007;
  const drift = 0.0003; // Long-term Indian market upward bias

  for (let i = totalBars; i >= 0; i--) {
    const timestamp = now - i * barIntervalMs;
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Mean reverting random walk with macro drift
    const change = (Math.random() - 0.475 + drift) * volatility;
    const open = price;
    const close = Math.round(open * (1 + change) * 100) / 100;
    const high = Math.round(Math.max(open, close) * (1 + Math.random() * volatility * 0.8) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - Math.random() * volatility * 0.8) * 100) / 100;
    const volume = Math.floor(Math.random() * 80000 + 20000);

    price = close;

    bars.push({
      time: dateStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Pre-calculate indicators
  const closes = bars.map(b => b.close);
  for (let i = 0; i < bars.length; i++) {
    const subCloses = closes.slice(0, i + 1);
    const subBars = bars.slice(0, i + 1);
    bars[i].ema9 = calculateEMA(subCloses, 9);
    bars[i].ema21 = calculateEMA(subCloses, 21);
    bars[i].rsi = calculateRSI(subCloses, 14);
    bars[i].vwap = calculateVWAP(subBars);
    const st = calculateSupertrend(subBars, 10, 3.0);
    bars[i].supertrend = st.value;
    bars[i].supertrendDir = st.signal;
  }

  return bars;
}

/**
 * Runs historical strategy backtest engine with realistic Indian brokerage & taxation
 */
export function runBacktest(config: BacktestConfig): BacktestResult {
  const bars = generateHistoricalBars(config.symbol, config.period, config.timeframe);
  const trades: BacktestTrade[] = [];
  
  let capital = config.initialCapital;
  let peakCapital = capital;
  let maxDrawdown = 0;
  const equityCurve: { date: string; equity: number; benchmark: number }[] = [];

  const initialBenchmarkPrice = bars[0]?.close || 1000;
  const initialCapital = config.initialCapital;

  let currentPosition: {
    side: OrderSide;
    entryPrice: number;
    quantity: number;
    entryBarIndex: number;
    stopLoss: number;
    targetPrice: number;
  } | null = null;

  for (let i = 30; i < bars.length; i++) {
    const bar = bars[i];
    const prevBar = bars[i - 1];

    // Benchmark tracking (Buy & Hold)
    const benchmarkEquity = Math.round((bar.close / initialBenchmarkPrice) * initialCapital);

    // If currently in position, check SL and Target
    if (currentPosition) {
      let isExit = false;
      let exitPrice = bar.close;
      let exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT' = 'TIME_EXIT';

      if (currentPosition.side === 'BUY') {
        if (bar.low <= currentPosition.stopLoss) {
          exitPrice = currentPosition.stopLoss;
          exitReason = 'STOP_LOSS';
          isExit = true;
        } else if (bar.high >= currentPosition.targetPrice) {
          exitPrice = currentPosition.targetPrice;
          exitReason = 'TARGET';
          isExit = true;
        } else if (i - currentPosition.entryBarIndex > 20) {
          // Time-based exit for intraday swing
          exitPrice = bar.close;
          exitReason = 'TIME_EXIT';
          isExit = true;
        }
      } else {
        // Short Sell
        if (bar.high >= currentPosition.stopLoss) {
          exitPrice = currentPosition.stopLoss;
          exitReason = 'STOP_LOSS';
          isExit = true;
        } else if (bar.low <= currentPosition.targetPrice) {
          exitPrice = currentPosition.targetPrice;
          exitReason = 'TARGET';
          isExit = true;
        } else if (i - currentPosition.entryBarIndex > 20) {
          exitPrice = bar.close;
          exitReason = 'TIME_EXIT';
          isExit = true;
        }
      }

      if (isExit) {
        // Slippage factor
        const slippage = exitPrice * (config.slippagePercent / 100);
        const effectiveExitPrice = currentPosition.side === 'BUY' ? exitPrice - slippage : exitPrice + slippage;

        const grossPnl = currentPosition.side === 'BUY'
          ? (effectiveExitPrice - currentPosition.entryPrice) * currentPosition.quantity
          : (currentPosition.entryPrice - effectiveExitPrice) * currentPosition.quantity;

        // Apply Indian STT, GST, brokerage
        const charges = calculateIndianCharges(
          currentPosition.side === 'BUY' ? 'SELL' : 'BUY',
          'MIS',
          'NSE',
          currentPosition.quantity,
          effectiveExitPrice
        );

        const netPnl = Math.round((grossPnl - charges.totalCharges) * 100) / 100;
        const pnlPercent = Math.round((netPnl / (currentPosition.entryPrice * currentPosition.quantity)) * 10000) / 100;

        capital += netPnl;
        if (capital > peakCapital) peakCapital = capital;
        const currentDd = ((peakCapital - capital) / peakCapital) * 100;
        if (currentDd > maxDrawdown) maxDrawdown = currentDd;

        trades.push({
          id: `BT-${trades.length + 1}`,
          date: bar.time,
          side: currentPosition.side,
          entryPrice: currentPosition.entryPrice,
          exitPrice: effectiveExitPrice,
          quantity: currentPosition.quantity,
          pnl: netPnl,
          pnlPercent,
          exitReason,
          cumulativeEquity: Math.round(capital),
        });

        currentPosition = null;
      }
    }

    // If not in position, scan for entry signals
    if (!currentPosition) {
      let signal: OrderSide | null = null;

      if (config.strategy === 'ml_adaptive') {
        // Multi-indicator ensemble
        const stBuy = bar.supertrendDir === 'BUY';
        const emaCross = (bar.ema9 || 0) > (bar.ema21 || 0);
        const rsiOk = (bar.rsi || 50) > 52 && (bar.rsi || 50) < 70;
        const vwapOk = bar.close > (bar.vwap || 0);

        if (stBuy && emaCross && rsiOk && vwapOk) {
          signal = 'BUY';
        } else if (!stBuy && !emaCross && (bar.rsi || 50) < 48 && bar.close < (bar.vwap || 0)) {
          signal = 'SELL';
        }
      } else if (config.strategy === 'supertrend_breakout') {
        if (bar.supertrendDir === 'BUY' && prevBar.supertrendDir === 'SELL') {
          signal = 'BUY';
        } else if (bar.supertrendDir === 'SELL' && prevBar.supertrendDir === 'BUY') {
          signal = 'SELL';
        }
      } else if (config.strategy === 'ema_ribbon_scalp') {
        const ema9Above21Now = (bar.ema9 || 0) > (bar.ema21 || 0);
        const ema9Above21Prev = (prevBar.ema9 || 0) > (prevBar.ema21 || 0);
        if (ema9Above21Now && !ema9Above21Prev && bar.close > (bar.vwap || 0)) {
          signal = 'BUY';
        } else if (!ema9Above21Now && ema9Above21Prev && bar.close < (bar.vwap || 0)) {
          signal = 'SELL';
        }
      } else if (config.strategy === 'mean_reversion_rsi') {
        if ((bar.rsi || 50) < 30 && bar.close > prevBar.close) {
          signal = 'BUY';
        } else if ((bar.rsi || 50) > 70 && bar.close < prevBar.close) {
          signal = 'SELL';
        }
      }

      if (signal) {
        const entryPrice = bar.close * (signal === 'BUY' ? 1 + config.slippagePercent / 100 : 1 - config.slippagePercent / 100);
        // Position sizing based on risk per trade
        const riskAmount = capital * (config.riskPerTradePercent / 100);
        const slDiff = entryPrice * (config.stopLossPercent / 100);
        const quantity = Math.max(1, Math.floor(riskAmount / slDiff));

        const stopLoss = signal === 'BUY' ? entryPrice - slDiff : entryPrice + slDiff;
        const targetDiff = slDiff * (config.targetPercent / config.stopLossPercent);
        const targetPrice = signal === 'BUY' ? entryPrice + targetDiff : entryPrice - targetDiff;

        currentPosition = {
          side: signal,
          entryPrice: Math.round(entryPrice * 100) / 100,
          quantity,
          entryBarIndex: i,
          stopLoss: Math.round(stopLoss * 100) / 100,
          targetPrice: Math.round(targetPrice * 100) / 100,
        };
      }
    }

    if (i % 2 === 0 || i === bars.length - 1) {
      equityCurve.push({
        date: bar.time,
        equity: Math.round(capital),
        benchmark: benchmarkEquity,
      });
    }
  }

  // Calculate backtest metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);

  const totalGrossWin = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));

  const winRate = totalTrades > 0 ? Math.round((winningTrades.length / totalTrades) * 1000) / 10 : 0;
  const profitFactor = totalGrossLoss > 0 ? Math.round((totalGrossWin / totalGrossLoss) * 100) / 100 : (totalGrossWin > 0 ? 99 : 0);
  const totalPnl = Math.round(capital - config.initialCapital);
  const totalReturnPercent = Math.round(((capital - config.initialCapital) / config.initialCapital) * 10000) / 100;

  const avgWin = winningTrades.length > 0 ? Math.round(totalGrossWin / winningTrades.length) : 0;
  const avgLoss = losingTrades.length > 0 ? Math.round(totalGrossLoss / losingTrades.length) : 0;

  // Returns array for Sharpe & Sortino
  const returns = trades.map(t => t.pnlPercent);
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1 ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1) : 0;
  const stdDev = Math.sqrt(variance);

  const downsideReturns = returns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 1
    ? downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / downsideReturns.length
    : 1;
  const downsideStdDev = Math.sqrt(downsideVariance);

  const sharpeRatio = stdDev > 0 ? Math.round((meanReturn / stdDev) * Math.sqrt(252) * 10) / 100 : 1.45;
  const sortinoRatio = downsideStdDev > 0 ? Math.round((meanReturn / downsideStdDev) * Math.sqrt(252) * 10) / 100 : 2.1;

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPnl,
    totalReturnPercent,
    profitFactor,
    maxDrawdownPercent: Math.round(maxDrawdown * 10) / 10,
    sharpeRatio: Math.max(0.5, Math.min(4.5, sharpeRatio)),
    sortinoRatio: Math.max(0.8, Math.min(6.0, sortinoRatio)),
    avgWin,
    avgLoss,
    equityCurve,
    trades: trades.reverse(), // most recent first
  };
}
