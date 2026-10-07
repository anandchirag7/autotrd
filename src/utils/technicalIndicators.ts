import { Candle, TradeCharges, OrderSide, OrderType, Exchange } from '../types';

/**
 * Calculates Wilder's 14-period Relative Strength Index
 */
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;
  
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((acc, val) => acc + val, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 1;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const slice = trueRanges.slice(-period);
  return slice.reduce((acc, val) => acc + val, 0) / slice.length;
}

/**
 * Calculates Supertrend Indicator (ATR * Multiplier)
 */
export function calculateSupertrend(
  candles: Candle[],
  period: number = 10,
  multiplier: number = 3.0
): { signal: 'BUY' | 'SELL'; value: number } {
  if (candles.length < period + 1) {
    return { signal: 'BUY', value: candles[candles.length - 1]?.close || 100 };
  }

  const atr = calculateATR(candles, period);
  const lastCandle = candles[candles.length - 1];
  const hl2 = (lastCandle.high + lastCandle.low) / 2;

  const basicUpperBand = hl2 + multiplier * atr;
  const basicLowerBand = hl2 - multiplier * atr;

  // Signal heuristic based on price versus bands
  const close = lastCandle.close;
  if (close > basicLowerBand && close >= hl2) {
    return { signal: 'BUY', value: Math.round(basicLowerBand * 100) / 100 };
  } else {
    return { signal: 'SELL', value: Math.round(basicUpperBand * 100) / 100 };
  }
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; hist: number } {
  if (closes.length < slowPeriod) {
    return { macd: 0, signal: 0, hist: 0 };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macd = fastEMA - slowEMA;
  
  // Approximate signal line
  const recentCloses = closes.slice(-signalPeriod);
  const signal = calculateEMA(recentCloses.map(c => c * 0.05), signalPeriod);
  const hist = macd - signal;

  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    hist: Math.round(hist * 100) / 100,
  };
}

/**
 * Calculates Intraday VWAP
 */
export function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let totalPV = 0;
  let totalVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    totalPV += typicalPrice * c.volume;
    totalVolume += c.volume;
  }

  return totalVolume > 0 ? totalPV / totalVolume : candles[candles.length - 1].close;
}

/**
 * Calculates accurate Indian Stock Market Transaction Taxes and Brokerage Charges
 * (Compliant with SEBI, NSE, BSE, Central GST, State GST, STT and Stamp Duty rules)
 */
export function calculateIndianCharges(
  side: OrderSide,
  orderType: OrderType,
  exchange: Exchange,
  quantity: number,
  price: number
): TradeCharges {
  const turnover = quantity * price;

  // Brokerage: Flat ₹20 per executed order or 0.03% (whichever is lower for discount brokers like Zerodha/AngelOne)
  const brokerage = Math.min(20, turnover * 0.0003);

  // STT (Securities Transaction Tax):
  // For Intraday (MIS): 0.025% on SELL turnover only
  // For Delivery (CNC): 0.1% on BUY and SELL turnover
  let stt = 0;
  if (orderType === 'MIS') {
    if (side === 'SELL') {
      stt = turnover * 0.00025;
    }
  } else {
    stt = turnover * 0.001;
  }

  // Exchange Transaction Charges: NSE: 0.00297%, BSE: 0.00375%
  const exchangeRate = exchange === 'NSE' ? 0.0000297 : 0.0000375;
  const exchangeCharges = turnover * exchangeRate;

  // SEBI Turnover Charge: ₹10 per crore (0.000001)
  const sebiTurnover = turnover * 0.000001;

  // Stamp Duty: 0.003% on BUY side for Intraday (or 0.015% for Delivery)
  let stampDuty = 0;
  if (side === 'BUY') {
    stampDuty = orderType === 'MIS' ? turnover * 0.00003 : turnover * 0.00015;
  }

  // GST: 18% on (Brokerage + Exchange Charges + SEBI Charges)
  const gst = 0.18 * (brokerage + exchangeCharges + sebiTurnover);

  const totalCharges = brokerage + stt + exchangeCharges + sebiTurnover + stampDuty + gst;

  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeCharges: Math.round(exchangeCharges * 100) / 100,
    sebiTurnover: Math.round(sebiTurnover * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
  };
}

/**
 * Format Indian Rupee currency with commas (Lakh / Crore style)
 */
export function formatINR(value: number, includeSign: boolean = false): string {
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  
  // Format with Indian numbering system
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const sign = isNegative ? '-₹' : (includeSign && value > 0 ? '+₹' : '₹');
  return `${sign}${formatted}`;
}
