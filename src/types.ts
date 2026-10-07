export type Exchange = 'NSE' | 'BSE';

export type OrderSide = 'BUY' | 'SELL';

export type OrderType = 'MIS' | 'CNC';

export type StrategyType = 
  | 'ml_adaptive' 
  | 'supertrend_breakout' 
  | 'ema_ribbon_scalp' 
  | 'mean_reversion_rsi';

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  ema9?: number;
  ema21?: number;
  supertrend?: number;
  supertrendDir?: 'BUY' | 'SELL';
  rsi?: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: string;
  lotSize: number;
  ltp: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  vwap: number;
  rsi: number;
  supertrendSignal: 'BUY' | 'SELL';
  supertrendValue: number;
  ema9: number;
  ema21: number;
  ema50: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  atr: number;
  mlConfidence: number; // 0-100%
  mlSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  mlTrendPredicted: 'UP' | 'DOWN' | 'SIDEWAYS';
  candles: Candle[];
}

export interface TradeCharges {
  stt: number; // Securities Transaction Tax
  brokerage: number;
  exchangeCharges: number;
  sebiTurnover: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
}

export interface ActivePosition {
  id: string;
  orderId: string;
  symbol: string;
  exchange: Exchange;
  side: OrderSide;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
  stopLoss: number;
  targetPrice: number;
  trailingSl: number;
  highestPriceSinceEntry: number;
  lowestPriceSinceEntry: number;
  entryTime: string;
  mlConfidence: number;
  strategyName: string;
  orderType: OrderType;
}

export interface ExecutedTrade {
  id: string;
  orderId: string;
  symbol: string;
  exchange: Exchange;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  grossPnl: number;
  netPnl: number;
  pnlPercent: number;
  charges: TradeCharges;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TRAILING_SL' | 'SQUARE_OFF' | 'MANUAL' | 'CIRCUIT';
  strategyName: string;
  orderType: OrderType;
  mlScoreAtEntry: number;
}

export interface TradeAlert {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'TARGET_HIT' | 'SL_HIT' | 'SQUARE_OFF' | 'CIRCUIT_BREAKER' | 'STRATEGY_SHIFT';
  symbol?: string;
  title: string;
  message: string;
  pnl?: number;
  read?: boolean;
}

export interface BotConfig {
  isActive: boolean;
  isPaused: boolean;
  killSwitchEngaged: boolean;
  tradingMode: 'paper' | 'live';
  broker: 'zerodha' | 'angelone' | 'upstox' | 'dhan' | 'groww';
  capitalAllocated: number; // ₹ INR
  riskPerTradePercent: number; // e.g. 1.5%
  targetRiskRewardRatio: number; // e.g. 2.0
  maxOpenPositions: number; // e.g. 4
  dailyMaxLossLimit: number; // ₹ INR, e.g. 5000
  trailingSlEnabled: boolean;
  trailingStepPercent: number; // e.g. 0.5%
  intradayAutoSquareOffTime: string; // "15:15" IST
  mlConfidenceThreshold: number; // e.g. 65%
  autoStrategyAdjustment: boolean;
  selectedStrategy: StrategyType;
  soundAlerts: boolean;
  tickIntervalMs: number; // e.g. 2000ms
  productType: OrderType;
  exchanges: Exchange[];
}

export type ModelProvider = 'gemini' | 'local_ollama' | 'openai_compatible';

export interface ModelSettings {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  isLocal: boolean;
  status: 'connected' | 'untested' | 'error';
  lastPingMs?: number;
}

export interface AgentPrompts {
  marketRegimePrompt: string;
  stockAnalysisPrompt: string;
  riskRulesPrompt: string;
}

export interface BrokerApiCredentials {
  brokerId: 'zerodha' | 'angelone' | 'upstox' | 'dhan' | 'groww';
  clientId: string;
  apiKey: string;
  apiSecret: string;
  totpToken: string;
  redirectUrl: string;
  sandboxMode: boolean;
  autoLogin: boolean;
}

export interface BrokerAccount {
  connected: boolean;
  brokerId: string;
  brokerName: string;
  clientId: string;
  apiKeyMasked: string;
  mode: 'paper' | 'live';
  funds: {
    totalMargin: number;
    availableMargin: number;
    utilizedMargin: number;
    collateral: number;
  };
  pingLatencyMs: number;
  lastSync: string;
  tokenExpiresAt: string;
}

export interface BacktestConfig {
  symbol: string;
  strategy: StrategyType;
  timeframe: '5m' | '15m' | '1h' | '1D';
  period: '1M' | '3M' | '6M' | '1Y' | '3Y';
  initialCapital: number;
  riskPerTradePercent: number;
  stopLossPercent: number;
  targetPercent: number;
  slippagePercent: number;
}

export interface BacktestTrade {
  id: string;
  date: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT';
  cumulativeEquity: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalReturnPercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: { date: string; equity: number; benchmark: number }[];
  trades: BacktestTrade[];
}

export interface AIMarketRegime {
  regime: string;
  confidence: number;
  analysis: string;
  source?: string;
  recommendations: {
    recommendedStrategy: string;
    riskPerTradePercent: number;
    trailingSlMultiplier: number;
    targetRiskRewardRatio: number;
    activeInstruments: string[];
    squareOffWarning: string;
  };
  adjustedSettings?: {
    maxDrawdownPercent: number;
    stopLossAtrFactor: number;
    targetRiskReward: number;
    supertrendMultiplier: number;
    rsiThresholdUpper: number;
    rsiThresholdLower: number;
  };
}
