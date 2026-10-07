import { StockQuote, Candle } from '../types';
import { calculateEMA, calculateRSI, calculateSupertrend, calculateVWAP, calculateMACD, calculateATR } from '../utils/technicalIndicators';

interface StockDefinition {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  lotSize: number;
  basePrice: number;
  volatility: number;
  trend: number; // positive = upward bias, negative = downward bias
}

const STOCK_DEFINITIONS: StockDefinition[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50 Index', exchange: 'NSE', sector: 'Index', lotSize: 25, basePrice: 24850.50, volatility: 0.0035, trend: 0.001 },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', exchange: 'NSE', sector: 'Index', lotSize: 15, basePrice: 52420.00, volatility: 0.0055, trend: 0.0015 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', sector: 'Energy & Retail', lotSize: 250, basePrice: 2985.40, volatility: 0.004, trend: 0.0012 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', sector: 'Banking', lotSize: 550, basePrice: 1648.75, volatility: 0.0038, trend: 0.0008 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services', lotSize: 175, basePrice: 4210.60, volatility: 0.0045, trend: -0.0005 },
  { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', sector: 'IT Services', lotSize: 400, basePrice: 1892.30, volatility: 0.005, trend: 0.002 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', sector: 'Banking', lotSize: 700, basePrice: 1224.50, volatility: 0.0042, trend: 0.0018 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', exchange: 'NSE', sector: 'Automobile', lotSize: 1425, basePrice: 978.20, volatility: 0.006, trend: 0.0025 },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', sector: 'PSU Banking', lotSize: 1500, basePrice: 812.40, volatility: 0.005, trend: -0.0008 },
  { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', sector: 'FMCG', lotSize: 1600, basePrice: 504.80, volatility: 0.0025, trend: 0.0004 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', sector: 'Telecom', lotSize: 950, basePrice: 1564.10, volatility: 0.0048, trend: 0.0022 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', exchange: 'NSE', sector: 'Infrastructure', lotSize: 300, basePrice: 3620.00, volatility: 0.004, trend: 0.0011 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'BSE', sector: 'Financial Services', lotSize: 125, basePrice: 7180.50, volatility: 0.0055, trend: -0.001 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', exchange: 'NSE', sector: 'Automobile', lotSize: 100, basePrice: 12450.00, volatility: 0.004, trend: 0.0015 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', exchange: 'BSE', sector: 'Pharma', lotSize: 350, basePrice: 1785.60, volatility: 0.0035, trend: 0.0007 },
];

/**
 * Generates initial realistic historical intraday 5m candle bars (40 candles)
 */
function generateCandles(basePrice: number, volatility: number, trendBias: number): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let currentPrice = basePrice * (1 - volatility * 6);

  for (let i = 40; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000;
    const dateObj = new Date(timestamp);
    const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const changeFactor = (Math.random() - 0.48 + trendBias) * volatility;
    const open = currentPrice;
    const close = Math.round(open * (1 + changeFactor) * 100) / 100;
    const high = Math.round(Math.max(open, close) * (1 + Math.random() * volatility * 0.7) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - Math.random() * volatility * 0.7) * 100) / 100;
    const volume = Math.floor(Math.random() * 50000 + 15000);

    currentPrice = close;

    candles.push({
      time: timeStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Populate indicator overlays on candles
  const closes = candles.map(c => c.close);
  for (let idx = 0; idx < candles.length; idx++) {
    const subCloses = closes.slice(0, idx + 1);
    const subCandles = candles.slice(0, idx + 1);

    candles[idx].ema9 = Math.round(calculateEMA(subCloses, 9) * 100) / 100;
    candles[idx].ema21 = Math.round(calculateEMA(subCloses, 21) * 100) / 100;
    candles[idx].rsi = Math.round(calculateRSI(subCloses, 14) * 10) / 10;
    candles[idx].vwap = Math.round(calculateVWAP(subCandles) * 100) / 100;

    const st = calculateSupertrend(subCandles, 10, 3.0);
    candles[idx].supertrend = st.value;
    candles[idx].supertrendDir = st.signal;
  }

  return candles;
}

/**
 * Creates full initial list of Indian stocks with technical indicators & ML signals
 */
export function getInitialIndianStocks(): StockQuote[] {
  return STOCK_DEFINITIONS.map(def => {
    const candles = generateCandles(def.basePrice, def.volatility, def.trend);
    const lastCandle = candles[candles.length - 1];
    const firstCandle = candles[0];
    const closes = candles.map(c => c.close);

    const ltp = lastCandle.close;
    const previousClose = firstCandle.open;
    const change = Math.round((ltp - previousClose) * 100) / 100;
    const changePercent = Math.round((change / previousClose) * 10000) / 100;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const open = firstCandle.open;
    const high = Math.max(...highs);
    const low = Math.min(...lows);
    const volume = candles.reduce((acc, c) => acc + c.volume, 0);

    const rsi = calculateRSI(closes, 14);
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const macdData = calculateMACD(closes, 12, 26, 9);
    const atr = calculateATR(candles, 14);
    const vwap = calculateVWAP(candles);
    const st = calculateSupertrend(candles, 10, 3.0);

    // Compute ML multi-factor score
    let mlBullishFactors = 0;
    let mlTotalFactors = 7;

    if (st.signal === 'BUY') mlBullishFactors++;
    if (rsi > 52 && rsi < 72) mlBullishFactors += 1.5;
    if (ema9 > ema21) mlBullishFactors++;
    if (ltp > vwap) mlBullishFactors++;
    if (macdData.hist > 0) mlBullishFactors++;
    if (changePercent > 0.2) mlBullishFactors++;
    if (lastCandle.volume > (volume / candles.length)) mlBullishFactors++;

    const mlRatio = mlBullishFactors / mlTotalFactors;
    let mlSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    let mlConfidence: number;
    let mlTrendPredicted: 'UP' | 'DOWN' | 'SIDEWAYS';

    if (mlRatio >= 0.78) {
      mlSignal = 'STRONG_BUY';
      mlConfidence = Math.min(94, Math.floor(mlRatio * 100) + 5);
      mlTrendPredicted = 'UP';
    } else if (mlRatio >= 0.58) {
      mlSignal = 'BUY';
      mlConfidence = Math.floor(mlRatio * 100);
      mlTrendPredicted = 'UP';
    } else if (mlRatio <= 0.28) {
      mlSignal = 'STRONG_SELL';
      mlConfidence = Math.min(92, Math.floor((1 - mlRatio) * 100) + 5);
      mlTrendPredicted = 'DOWN';
    } else if (mlRatio <= 0.42) {
      mlSignal = 'SELL';
      mlConfidence = Math.floor((1 - mlRatio) * 100);
      mlTrendPredicted = 'DOWN';
    } else {
      mlSignal = 'NEUTRAL';
      mlConfidence = 52;
      mlTrendPredicted = 'SIDEWAYS';
    }

    return {
      symbol: def.symbol,
      name: def.name,
      exchange: def.exchange,
      sector: def.sector,
      lotSize: def.lotSize,
      ltp,
      open,
      high,
      low,
      previousClose,
      change,
      changePercent,
      volume,
      vwap: Math.round(vwap * 100) / 100,
      rsi: Math.round(rsi * 10) / 10,
      supertrendSignal: st.signal,
      supertrendValue: st.value,
      ema9: Math.round(ema9 * 100) / 100,
      ema21: Math.round(ema21 * 100) / 100,
      ema50: Math.round(ema50 * 100) / 100,
      macd: macdData.macd,
      macdSignal: macdData.signal,
      macdHist: macdData.hist,
      atr: Math.round(atr * 100) / 100,
      mlConfidence,
      mlSignal,
      mlTrendPredicted,
      candles,
    };
  });
}
