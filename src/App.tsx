import React, { useState, useEffect, useRef } from 'react';
import { Header, ActiveTabType } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { CandlestickChart } from './components/CandlestickChart';
import { WatchlistPanel } from './components/WatchlistPanel';
import { PositionsTable } from './components/PositionsTable';
import { OrderBookTable } from './components/OrderBookTable';
import { LiveAlertsDrawer } from './components/LiveAlertsDrawer';
import { StrategySettingsModal } from './components/StrategySettingsModal';
import { BrokerConnectModal } from './components/BrokerConnectModal';
import { BacktestingEngine } from './components/BacktestingEngine';
import { AIStrategyAdvisor } from './components/AIStrategyAdvisor';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsHub } from './components/SettingsHub';

import { getInitialIndianStocks } from './data/indianStocks';
import { 
  StockQuote, 
  ActivePosition, 
  ExecutedTrade, 
  TradeAlert, 
  BotConfig, 
  BrokerAccount, 
  OrderSide,
  ModelSettings,
  AgentPrompts,
  BrokerApiCredentials
} from './types';
import { calculateIndianCharges, formatINR, calculateEMA, calculateRSI, calculateSupertrend, calculateVWAP } from './utils/technicalIndicators';
import { soundEngine } from './utils/soundEffects';

export default function App() {
  // Initial Stocks List
  const [stocks, setStocks] = useState<StockQuote[]>(() => getInitialIndianStocks());
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('5m');

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTabType>('terminal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);

  // AI Model & Inference Engine State
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    provider: 'gemini',
    modelName: 'gemini-3.8-flash',
    apiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    isLocal: false,
    temperature: 0.2,
    maxTokens: 1024,
    status: 'ready',
    lastPingMs: 24,
  });

  // Agent Prompts Customizer State
  const [agentPrompts, setAgentPrompts] = useState<AgentPrompts>({
    marketRegimePrompt: `You are an elite quantitative portfolio manager specializing in Indian equities (NSE & BSE).
Analyze real-time market data across NIFTY 50, BANKNIFTY, sector performance, and advance-decline ratios.
Classify market regime into TRENDING_BULLISH, TRENDING_BEARISH, CHOPPY_VOLATILE, or RANGE_BOUND.
Recommend the optimal algorithmic strategy and safe capital allocation.`,
    stockAnalysisPrompt: `You are a high-frequency algorithmic execution agent for Indian stock markets.
Examine the scrip's technical indicator signals (RSI-14, SuperTrend 10/3, VWAP, EMA 9/21/50/200, Volume Spike, ATR).
Provide a deterministic trading signal: BUY, SELL, or HOLD, with entry, stop-loss, target, and risk-reward ratio.`,
    riskRulesPrompt: `Strict quantitative risk management protocol:
1. Never risk more than the allocated risk percentage per trade.
2. Maximize intraday profit retention with dynamic trailing stop-loss.
3. Automatically square-off all MIS intraday positions before 15:15 IST.
4. If daily loss exceeds circuit limit, halt all autonomous execution immediately.`,
  });

  // Broker API Credentials State
  const [brokerCredentials, setBrokerCredentials] = useState<BrokerApiCredentials>({
    brokerId: 'zerodha',
    clientId: 'ZR-VIRTUAL-IND',
    apiKey: 'kite_prod_api_key_demo',
    apiSecret: 'kite_secret_demo_hash_982',
    totpToken: 'JBSWY3DPEHPK3PXP',
    redirectUrl: 'http://localhost:3000/api/broker/callback',
    sandboxMode: true,
  });

  // Bot Configuration
  const [config, setConfig] = useState<BotConfig>({
    isActive: true,
    isPaused: false,
    killSwitchEngaged: false,
    tradingMode: 'paper',
    broker: 'zerodha',
    capitalAllocated: 500000,
    riskPerTradePercent: 1.5,
    targetRiskRewardRatio: 2.2,
    maxOpenPositions: 4,
    dailyMaxLossLimit: 8000,
    trailingSlEnabled: true,
    trailingStepPercent: 0.4,
    intradayAutoSquareOffTime: '15:15',
    mlConfidenceThreshold: 70,
    autoStrategyAdjustment: true,
    selectedStrategy: 'ml_adaptive',
    soundAlerts: true,
    tickIntervalMs: 2000,
    productType: 'MIS',
    exchanges: ['NSE', 'BSE'],
  });

  // Broker Account State
  const [brokerAccount, setBrokerAccount] = useState<BrokerAccount>({
    connected: true,
    brokerId: 'zerodha',
    brokerName: 'Zerodha Kite Connect',
    clientId: 'ZR-VIRTUAL-IND',
    apiKeyMasked: 'kite••••7890',
    mode: 'paper',
    funds: {
      totalMargin: 500000,
      availableMargin: 462500,
      utilizedMargin: 37500,
      collateral: 0,
    },
    pingLatencyMs: 18,
    lastSync: '09:15:02',
    tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  });

  // Initial Open Positions Seed
  const [positions, setPositions] = useState<ActivePosition[]>([
    {
      id: 'POS-101',
      orderId: 'ORD-94182',
      symbol: 'RELIANCE',
      exchange: 'NSE',
      side: 'BUY',
      quantity: 50,
      avgPrice: 2975.20,
      ltp: 2985.40,
      pnl: 510.00,
      pnlPercent: 0.34,
      stopLoss: 2951.40,
      targetPrice: 3028.00,
      trailingSl: 2962.00,
      highestPriceSinceEntry: 2987.50,
      lowestPriceSinceEntry: 2974.00,
      entryTime: '09:32:14',
      mlConfidence: 84,
      strategyName: 'ML Adaptive',
      orderType: 'MIS',
    },
    {
      id: 'POS-102',
      orderId: 'ORD-94215',
      symbol: 'HDFCBANK',
      exchange: 'NSE',
      side: 'BUY',
      quantity: 100,
      avgPrice: 1642.50,
      ltp: 1648.75,
      pnl: 625.00,
      pnlPercent: 0.38,
      stopLoss: 1630.00,
      targetPrice: 1670.00,
      trailingSl: 1638.00,
      highestPriceSinceEntry: 1650.10,
      lowestPriceSinceEntry: 1641.00,
      entryTime: '10:04:22',
      mlConfidence: 78,
      strategyName: 'SuperTrend Breakout',
      orderType: 'MIS',
    }
  ]);

  // Initial Closed Trades Seed (History from morning session)
  const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([
    {
      id: 'TRD-901',
      orderId: 'ORD-93902',
      symbol: 'TCS',
      exchange: 'NSE',
      side: 'BUY',
      quantity: 40,
      entryPrice: 4185.00,
      exitPrice: 4235.50,
      entryTime: '09:20:10',
      exitTime: '10:15:40',
      grossPnl: 2020.00,
      netPnl: 1968.50,
      pnlPercent: 1.21,
      charges: calculateIndianCharges('SELL', 'MIS', 'NSE', 40, 4235.50),
      exitReason: 'TARGET',
      strategyName: 'ML Adaptive',
      orderType: 'MIS',
      mlScoreAtEntry: 82,
    },
    {
      id: 'TRD-902',
      orderId: 'ORD-93955',
      symbol: 'BANKNIFTY',
      exchange: 'NSE',
      side: 'BUY',
      quantity: 15,
      entryPrice: 52150.00,
      exitPrice: 52380.00,
      entryTime: '09:42:00',
      exitTime: '10:48:15',
      grossPnl: 3450.00,
      netPnl: 3382.40,
      pnlPercent: 0.44,
      charges: calculateIndianCharges('SELL', 'MIS', 'NSE', 15, 52380.00),
      exitReason: 'TRAILING_SL',
      strategyName: 'SuperTrend Breakout',
      orderType: 'MIS',
      mlScoreAtEntry: 88,
    },
    {
      id: 'TRD-903',
      orderId: 'ORD-94012',
      symbol: 'INFY',
      exchange: 'NSE',
      side: 'SELL',
      quantity: 80,
      entryPrice: 1898.00,
      exitPrice: 1908.50,
      entryTime: '10:12:30',
      exitTime: '10:35:00',
      grossPnl: -840.00,
      netPnl: -884.20,
      pnlPercent: -0.55,
      charges: calculateIndianCharges('BUY', 'MIS', 'NSE', 80, 1908.50),
      exitReason: 'STOP_LOSS',
      strategyName: 'EMA Ribbon Scalp',
      orderType: 'MIS',
      mlScoreAtEntry: 68,
    },
  ]);

  // Real-time Alerts Stream
  const [alerts, setAlerts] = useState<TradeAlert[]>([
    {
      id: 'ALT-1',
      timestamp: '10:48:15',
      type: 'TARGET_HIT',
      symbol: 'BANKNIFTY',
      title: 'BANKNIFTY Trailing Stop Booked',
      message: 'BANKNIFTY MIS position locked in +₹3,382.40 profit after trailing SL triggered at 52,380.',
      pnl: 3382.40,
    },
    {
      id: 'ALT-2',
      timestamp: '10:15:40',
      type: 'TARGET_HIT',
      symbol: 'TCS',
      title: 'TCS Target Reached',
      message: 'TCS MIS order hit target 4,235.50. Net gain of +₹1,968.50 booked automatically.',
      pnl: 1968.50,
    },
    {
      id: 'ALT-3',
      timestamp: '10:04:22',
      type: 'BUY',
      symbol: 'HDFCBANK',
      title: 'HDFCBANK Buy Order Executed',
      message: 'Autonomous Bot placed BUY 100 Qty @ 1642.50. SL: 1630.00 | TGT: 1670.00.',
    },
  ]);

  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);

  // Global unique ID generator to prevent key collisions
  const idCounterRef = useRef<number>(1000);
  const getUniqueId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${Date.now()}-${idCounterRef.current}-${Math.random().toString(36).substring(2, 6)}`;
  };

  // State refs for reliable interval processing without recreating timer
  const stocksRef = useRef<StockQuote[]>(stocks);
  stocksRef.current = stocks;

  const positionsRef = useRef<ActivePosition[]>(positions);
  positionsRef.current = positions;

  const configRef = useRef<BotConfig>(config);
  configRef.current = config;

  // Helper to append a new alert
  const addAlert = (alert: Omit<TradeAlert, 'id' | 'timestamp'>) => {
    const istTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newAlert: TradeAlert = {
      ...alert,
      id: getUniqueId('ALT'),
      timestamp: istTime,
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
    setUnreadAlertsCount(prev => prev + 1);
  };

  // Autonomous Bot Execution & Market Ticks Heartbeat Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const currentStocks = stocksRef.current;
      const currentPositions = positionsRef.current;
      const currentConfig = configRef.current;

      // 1. Simulate real-time price ticks across Indian equities
      const updatedStocks = currentStocks.map(stock => {
        const tickPct = (Math.random() - 0.49) * 0.003;
        const newLtp = Math.round(stock.ltp * (1 + tickPct) * 100) / 100;
        const change = Math.round((newLtp - stock.previousClose) * 100) / 100;
        const changePercent = Math.round((change / stock.previousClose) * 10000) / 100;
        const newHigh = Math.max(stock.high, newLtp);
        const newLow = Math.min(stock.low, newLtp);
        const newVolume = stock.volume + Math.floor(Math.random() * 400 + 50);

        const updatedCandles = [...stock.candles];
        const lastCandle = { ...updatedCandles[updatedCandles.length - 1] };
        lastCandle.close = newLtp;
        if (newLtp > lastCandle.high) lastCandle.high = newLtp;
        if (newLtp < lastCandle.low) lastCandle.low = newLtp;
        lastCandle.volume += Math.floor(Math.random() * 400 + 50);
        updatedCandles[updatedCandles.length - 1] = lastCandle;

        const closes = updatedCandles.map(c => c.close);
        const rsi = calculateRSI(closes, 14);
        const ema9 = calculateEMA(closes, 9);
        const ema21 = calculateEMA(closes, 21);
        const vwap = calculateVWAP(updatedCandles);
        const st = calculateSupertrend(updatedCandles, 10, 3.0);

        return {
          ...stock,
          ltp: newLtp,
          high: newHigh,
          low: newLow,
          change,
          changePercent,
          volume: newVolume,
          rsi: Math.round(rsi * 10) / 10,
          ema9: Math.round(ema9 * 100) / 100,
          ema21: Math.round(ema21 * 100) / 100,
          vwap: Math.round(vwap * 100) / 100,
          supertrendSignal: st.signal,
          supertrendValue: st.value,
          candles: updatedCandles,
        };
      });

      // 2. Evaluate Live Open Positions (Stop Loss, Target, Trailing SL)
      const newlyClosedTrades: ExecutedTrade[] = [];
      const remainingPositions: ActivePosition[] = [];
      const tickAlerts: TradeAlert[] = [];
      let playTargetSound = false;
      let playSlSound = false;
      let playOrderSound = false;

      const istTime = new Date().toLocaleTimeString('en-IN', { hour12: false });

      currentPositions.forEach(pos => {
        const currentStock = updatedStocks.find(s => s.symbol === pos.symbol);
        const currentPrice = currentStock ? currentStock.ltp : pos.ltp;

        const grossPnl = pos.side === 'BUY'
          ? (currentPrice - pos.avgPrice) * pos.quantity
          : (pos.avgPrice - currentPrice) * pos.quantity;
        const pnlPercent = (grossPnl / (pos.avgPrice * pos.quantity)) * 100;

        const highestPrice = Math.max(pos.highestPriceSinceEntry, currentPrice);
        const lowestPrice = Math.min(pos.lowestPriceSinceEntry, currentPrice);

        let trailingSl = pos.trailingSl;
        if (currentConfig.trailingSlEnabled) {
          const step = pos.avgPrice * (currentConfig.trailingStepPercent / 100);
          if (pos.side === 'BUY' && highestPrice > pos.avgPrice + step) {
            const newSl = highestPrice - (pos.avgPrice - pos.stopLoss);
            if (newSl > trailingSl) trailingSl = Math.round(newSl * 100) / 100;
          } else if (pos.side === 'SELL' && lowestPrice < pos.avgPrice - step) {
            const newSl = lowestPrice + (pos.stopLoss - pos.avgPrice);
            if (newSl < trailingSl) trailingSl = Math.round(newSl * 100) / 100;
          }
        }

        let isExit = false;
        let exitReason: 'TARGET' | 'STOP_LOSS' | 'TRAILING_SL' = 'TARGET';

        if (pos.side === 'BUY') {
          if (currentPrice >= pos.targetPrice) {
            isExit = true;
            exitReason = 'TARGET';
          } else if (trailingSl && currentPrice <= trailingSl) {
            isExit = true;
            exitReason = trailingSl > pos.stopLoss ? 'TRAILING_SL' : 'STOP_LOSS';
          } else if (currentPrice <= pos.stopLoss) {
            isExit = true;
            exitReason = 'STOP_LOSS';
          }
        } else {
          if (currentPrice <= pos.targetPrice) {
            isExit = true;
            exitReason = 'TARGET';
          } else if (trailingSl && currentPrice >= trailingSl) {
            isExit = true;
            exitReason = trailingSl < pos.stopLoss ? 'TRAILING_SL' : 'STOP_LOSS';
          } else if (currentPrice >= pos.stopLoss) {
            isExit = true;
            exitReason = 'STOP_LOSS';
          }
        }

        if (isExit) {
          const charges = calculateIndianCharges(
            pos.side === 'BUY' ? 'SELL' : 'BUY',
            pos.orderType,
            pos.exchange,
            pos.quantity,
            currentPrice
          );

          const netPnl = Math.round((grossPnl - charges.totalCharges) * 100) / 100;

          const closedTrade: ExecutedTrade = {
            id: getUniqueId('TRD'),
            orderId: pos.orderId,
            symbol: pos.symbol,
            exchange: pos.exchange,
            side: pos.side,
            quantity: pos.quantity,
            entryPrice: pos.avgPrice,
            exitPrice: currentPrice,
            entryTime: pos.entryTime,
            exitTime: istTime,
            grossPnl: Math.round(grossPnl * 100) / 100,
            netPnl,
            pnlPercent: Math.round(pnlPercent * 100) / 100,
            charges,
            exitReason,
            strategyName: pos.strategyName,
            orderType: pos.orderType,
            mlScoreAtEntry: pos.mlConfidence,
          };

          newlyClosedTrades.push(closedTrade);

          if (exitReason === 'TARGET') {
            playTargetSound = true;
          } else {
            playSlSound = true;
          }

          tickAlerts.push({
            id: getUniqueId('ALT'),
            timestamp: istTime,
            type: exitReason === 'TARGET' ? 'TARGET_HIT' : 'SL_HIT',
            symbol: pos.symbol,
            title: `${pos.symbol} ${exitReason === 'TARGET' ? 'Target Hit' : 'SL Triggered'}`,
            message: `${pos.symbol} closed @ ₹${currentPrice}. Net P&L: ${netPnl >= 0 ? '+' : ''}₹${netPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%). Reason: ${exitReason}.`,
            pnl: netPnl,
          });
        } else {
          remainingPositions.push({
            ...pos,
            ltp: currentPrice,
            pnl: Math.round(grossPnl * 100) / 100,
            pnlPercent: Math.round(pnlPercent * 100) / 100,
            highestPriceSinceEntry: highestPrice,
            lowestPriceSinceEntry: lowestPrice,
            trailingSl,
          });
        }
      });

      // 3. Autonomous Agent Order Triggering (When Bot is Active & Conditions Align)
      if (currentConfig.isActive && !currentConfig.isPaused && !currentConfig.killSwitchEngaged) {
        if (remainingPositions.length < currentConfig.maxOpenPositions) {
          const heldSymbols = new Set(remainingPositions.map(p => p.symbol));
          const candidate = updatedStocks.find(s => 
            !heldSymbols.has(s.symbol) &&
            s.mlConfidence >= currentConfig.mlConfidenceThreshold &&
            (s.mlSignal === 'STRONG_BUY' || s.mlSignal === 'STRONG_SELL')
          );

          if (candidate) {
            const side: OrderSide = candidate.mlSignal.includes('BUY') ? 'BUY' : 'SELL';
            const riskAmount = currentConfig.capitalAllocated * (currentConfig.riskPerTradePercent / 100);
            const slDistance = candidate.ltp * 0.008;
            const quantity = Math.max(1, Math.floor(riskAmount / slDistance));

            const stopLoss = side === 'BUY'
              ? Math.round((candidate.ltp - slDistance) * 100) / 100
              : Math.round((candidate.ltp + slDistance) * 100) / 100;

            const targetDistance = slDistance * currentConfig.targetRiskRewardRatio;
            const targetPrice = side === 'BUY'
              ? Math.round((candidate.ltp + targetDistance) * 100) / 100
              : Math.round((candidate.ltp - targetDistance) * 100) / 100;

            const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

            const newPos: ActivePosition = {
              id: getUniqueId('POS'),
              orderId,
              symbol: candidate.symbol,
              exchange: candidate.exchange,
              side,
              quantity,
              avgPrice: candidate.ltp,
              ltp: candidate.ltp,
              pnl: 0,
              pnlPercent: 0,
              stopLoss,
              targetPrice,
              trailingSl: stopLoss,
              highestPriceSinceEntry: candidate.ltp,
              lowestPriceSinceEntry: candidate.ltp,
              entryTime: istTime,
              mlConfidence: candidate.mlConfidence,
              strategyName: currentConfig.selectedStrategy === 'ml_adaptive' ? 'ML Adaptive' : 'SuperTrend Breakout',
              orderType: currentConfig.productType,
            };

            remainingPositions.push(newPos);
            playOrderSound = true;

            tickAlerts.push({
              id: getUniqueId('ALT'),
              timestamp: istTime,
              type: side === 'BUY' ? 'BUY' : 'SELL',
              symbol: candidate.symbol,
              title: `Autonomous ${side} Order: ${candidate.symbol}`,
              message: `Bot executed ${side} ${quantity} ${candidate.symbol} @ ₹${candidate.ltp} on ${candidate.exchange}. ML Score: ${candidate.mlConfidence}%. SL: ₹${stopLoss} | TGT: ₹${targetPrice}.`,
            });
          }
        }
      }

      // Clean atomic state updates
      setStocks(updatedStocks);
      setPositions(remainingPositions);

      if (newlyClosedTrades.length > 0) {
        setExecutedTrades(prev => [...newlyClosedTrades, ...prev]);
      }

      if (tickAlerts.length > 0) {
        setAlerts(prev => [...tickAlerts, ...prev.slice(0, 50 - tickAlerts.length)]);
        setUnreadAlertsCount(prev => prev + tickAlerts.length);
      }

      // Audio feedback
      if (currentConfig.soundAlerts) {
        if (playTargetSound) soundEngine.playTargetHit();
        else if (playSlSound) soundEngine.playStopLossHit();
        if (playOrderSound) soundEngine.playOrderExecuted();
      }

    }, config.tickIntervalMs || 2000);

    return () => clearInterval(timer);
  }, [config.tickIntervalMs]);

  // Handle Emergency Kill Switch
  const triggerKillSwitch = () => {
    if (config.killSwitchEngaged) {
      // Disengage
      setConfig(prev => ({ ...prev, killSwitchEngaged: false }));
      addAlert({
        type: 'CIRCUIT_BREAKER',
        title: 'Kill Switch Disengaged',
        message: 'Trading guard reset. Agent can now be reactivated.',
      });
      return;
    }

    // Square off all active positions immediately at market
    const closedPositions: ExecutedTrade[] = positions.map(pos => {
      const charges = calculateIndianCharges('SELL', pos.orderType, pos.exchange, pos.quantity, pos.ltp);
      const grossPnl = (pos.ltp - pos.avgPrice) * pos.quantity;
      const netPnl = grossPnl - charges.totalCharges;

      return {
        id: getUniqueId('TRD'),
        orderId: pos.orderId,
        symbol: pos.symbol,
        exchange: pos.exchange,
        side: pos.side,
        quantity: pos.quantity,
        entryPrice: pos.avgPrice,
        exitPrice: pos.ltp,
        entryTime: pos.entryTime,
        exitTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        grossPnl,
        netPnl,
        pnlPercent: (netPnl / (pos.avgPrice * pos.quantity)) * 100,
        charges,
        exitReason: 'CIRCUIT',
        strategyName: 'Kill Switch Safety',
        orderType: pos.orderType,
        mlScoreAtEntry: pos.mlConfidence,
      };
    });

    setExecutedTrades(prev => [...closedPositions, ...prev]);
    setPositions([]);
    setConfig(prev => ({ ...prev, killSwitchEngaged: true, isActive: false }));

    soundEngine.playStopLossHit();

    addAlert({
      type: 'CIRCUIT_BREAKER',
      title: 'EMERGENCY KILL SWITCH ACTIVATED',
      message: 'All open positions squared off at market price. Algorithmic execution terminated immediately.',
    });
  };

  // Square off single position manually
  const squareOffPosition = (posId: string) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos) return;

    const charges = calculateIndianCharges('SELL', pos.orderType, pos.exchange, pos.quantity, pos.ltp);
    const grossPnl = (pos.ltp - pos.avgPrice) * pos.quantity;
    const netPnl = grossPnl - charges.totalCharges;

    const closedTrade: ExecutedTrade = {
      id: getUniqueId('TRD'),
      orderId: pos.orderId,
      symbol: pos.symbol,
      exchange: pos.exchange,
      side: pos.side,
      quantity: pos.quantity,
      entryPrice: pos.avgPrice,
      exitPrice: pos.ltp,
      entryTime: pos.entryTime,
      exitTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      grossPnl,
      netPnl,
      pnlPercent: (netPnl / (pos.avgPrice * pos.quantity)) * 100,
      charges,
      exitReason: 'MANUAL',
      strategyName: pos.strategyName,
      orderType: pos.orderType,
      mlScoreAtEntry: pos.mlConfidence,
    };

    setExecutedTrades(prev => [closedTrade, ...prev]);
    setPositions(prev => prev.filter(p => p.id !== posId));

    addAlert({
      type: 'BUY',
      symbol: pos.symbol,
      title: `Manual Square-Off: ${pos.symbol}`,
      message: `User manually squared off ${pos.symbol} @ ₹${pos.ltp}. Net P&L: ${netPnl >= 0 ? '+' : ''}₹${netPnl.toFixed(2)}.`,
      pnl: netPnl,
    });
  };

  // Selected Stock for Candlestick Chart
  const activeStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  const activePositionOnChart = positions.find(p => p.symbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Main Navigation Header */}
      <Header
        config={config}
        brokerAccount={brokerAccount}
        alerts={alerts}
        unreadAlertsCount={unreadAlertsCount}
        onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenBrokerModal={() => setActiveTab('settings')}
        onOpenAlertsDrawer={() => {
          setIsAlertsDrawerOpen(true);
          setUnreadAlertsCount(0);
        }}
        onTriggerKillSwitch={triggerKillSwitch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          config={config}
          modelSettings={modelSettings}
          brokerAccount={brokerAccount}
          onToggleBot={() => setConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
        />

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
            
            {/* Performance Metric Cards (Shown on Terminal) */}
            {activeTab === 'terminal' && (
              <MetricCards
                positions={positions}
                executedTrades={executedTrades}
                brokerAccount={brokerAccount}
                config={config}
              />
            )}

            {/* Tab 1: Live Algorithmic Trading Terminal */}
            {activeTab === 'terminal' && (
              <div className="space-y-4">
                
                {/* Split Grid: Candlestick Chart & Live Watchlist */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Candlestick & Technical Indicators Canvas (2 cols) */}
                  <div className="lg:col-span-2">
                    <CandlestickChart
                      stock={activeStock}
                      activePosition={activePositionOnChart}
                      selectedTimeframe={selectedTimeframe}
                      onSelectTimeframe={setSelectedTimeframe}
                    />
                  </div>

                  {/* Indian Equities Watchlist & Real-Time ML Scanner (1 col) */}
                  <div className="lg:col-span-1">
                    <WatchlistPanel
                      stocks={stocks}
                      selectedSymbol={selectedSymbol}
                      onSelectStock={(st) => setSelectedSymbol(st.symbol)}
                    />
                  </div>

                </div>

                {/* Active Open Positions Table */}
                <PositionsTable
                  positions={positions}
                  onSquareOffPosition={squareOffPosition}
                  onSquareOffAll={() => {
                    positions.forEach(p => squareOffPosition(p.id));
                  }}
                  onSelectPositionSymbol={(sym) => setSelectedSymbol(sym)}
                />

                {/* Historical Executed Orders / Trade Book */}
                <OrderBookTable
                  executedTrades={executedTrades}
                />

              </div>
            )}

            {/* Tab 2: Pure Comprehensive Analytics Dashboard */}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                executedTrades={executedTrades}
                positions={positions}
                stocks={stocks}
                config={config}
              />
            )}

            {/* Tab 3: Historical Backtesting Engine */}
            {activeTab === 'backtest' && (
              <BacktestingEngine />
            )}

            {/* Tab 4: Dynamic AI Market Regime Advisor & Strategy Optimizer */}
            {activeTab === 'ai-advisor' && (
              <AIStrategyAdvisor
                stocks={stocks}
                config={config}
                modelSettings={modelSettings}
                agentPrompts={agentPrompts}
                onApplyAdjustments={(adj) => {
                  setConfig(prev => ({ ...prev, ...adj }));
                  addAlert({
                    type: 'STRATEGY_SHIFT',
                    title: 'Dynamic Strategy Parameters Applied',
                    message: `Agent adjusted Risk/Trade to ${adj.riskPerTradePercent}% and R:R target to 1:${adj.targetRiskRewardRatio}.`,
                  });
                }}
              />
            )}

            {/* Tab 5: Settings & Real Broker / Model API Hub */}
            {activeTab === 'settings' && (
              <SettingsHub
                config={config}
                modelSettings={modelSettings}
                agentPrompts={agentPrompts}
                brokerCredentials={brokerCredentials}
                brokerAccount={brokerAccount}
                onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
                onUpdateModelSettings={(updates) => setModelSettings(prev => ({ ...prev, ...updates }))}
                onUpdateAgentPrompts={(updates) => setAgentPrompts(prev => ({ ...prev, ...updates }))}
                onUpdateBrokerCredentials={(updates) => setBrokerCredentials(prev => ({ ...prev, ...updates }))}
                onResetPrompts={() => {
                  setAgentPrompts({
                    marketRegimePrompt: `You are an elite quantitative portfolio manager specializing in Indian equities (NSE & BSE).
Analyze real-time market data across NIFTY 50, BANKNIFTY, sector performance, and advance-decline ratios.
Classify market regime into TRENDING_BULLISH, TRENDING_BEARISH, CHOPPY_VOLATILE, or RANGE_BOUND.
Recommend the optimal algorithmic strategy and safe capital allocation.`,
                    stockAnalysisPrompt: `You are a high-frequency algorithmic execution agent for Indian stock markets.
Examine the scrip's technical indicator signals (RSI-14, SuperTrend 10/3, VWAP, EMA 9/21/50/200, Volume Spike, ATR).
Provide a deterministic trading signal: BUY, SELL, or HOLD, with entry, stop-loss, target, and risk-reward ratio.`,
                    riskRulesPrompt: `Strict quantitative risk management protocol:
1. Never risk more than the allocated risk percentage per trade.
2. Maximize intraday profit retention with dynamic trailing stop-loss.
3. Automatically square-off all MIS intraday positions before 15:15 IST.
4. If daily loss exceeds circuit limit, halt all autonomous execution immediately.`,
                  });
                }}
                onSaveAll={() => {
                  addAlert({
                    type: 'STRATEGY_SHIFT',
                    title: 'System Settings Applied',
                    message: `Broker (${brokerCredentials.brokerId.toUpperCase()}) & Model (${modelSettings.modelName}) settings successfully deployed to runtime.`,
                  });
                }}
              />
            )}

          </main>
        </div>
      </div>

      {/* Slide-out Real-time Alerts Drawer */}
      <LiveAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onClearAlerts={() => setAlerts([])}
      />

      {/* Strategy & Risk Rules Configuration Modal */}
      <StrategySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(updated) => {
          setConfig(prev => ({ ...prev, ...updated }));
          addAlert({
            type: 'STRATEGY_SHIFT',
            title: 'Bot Risk Rules Updated',
            message: 'Custom risk management and strategy rules have been applied to the agent.',
          });
        }}
      />

      {/* Indian Broker Connect Modal */}
      <BrokerConnectModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        brokerAccount={brokerAccount}
        config={config}
        onUpdateBroker={(account, mode) => {
          setBrokerAccount(account);
          setConfig(prev => ({ ...prev, tradingMode: mode }));
          addAlert({
            type: 'BUY',
            title: `Broker Connected: ${account.brokerName}`,
            message: `Account ${account.clientId} connected successfully in ${mode.toUpperCase()} mode. Available Margin: ${formatINR(account.funds.availableMargin)}.`,
          });
        }}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500 font-mono">
        Autonomous Indian Stock Market Trading Engine • NSE & BSE Broker API Gateway • Algorithmic Quantitative Execution
      </footer>

    </div>
  );
}
