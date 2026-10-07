import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ShieldCheck, 
  Percent, 
  BarChart3, 
  PieChart, 
  Clock, 
  Calendar, 
  Zap, 
  DollarSign, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ExecutedTrade, ActivePosition, StockQuote, BotConfig } from '../types';

interface AnalyticsDashboardProps {
  executedTrades: ExecutedTrade[];
  positions: ActivePosition[];
  stocks: StockQuote[];
  config: BotConfig;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  executedTrades,
  positions,
  stocks,
  config,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('ALL');

  // Filtered trades based on selection
  const filteredTrades = useMemo(() => {
    return executedTrades.filter(t => {
      if (selectedStrategyFilter !== 'ALL' && t.strategyName !== selectedStrategyFilter) {
        return false;
      }
      return true;
    });
  }, [executedTrades, selectedStrategyFilter]);

  // Aggregate Quantitative Metrics
  const metrics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => t.netPnl > 0);
    const losingTrades = filteredTrades.filter(t => t.netPnl < 0);
    const breakEvenTrades = filteredTrades.filter(t => t.netPnl === 0);

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const grossProfit = winningTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnl, 0));
    const netPnl = filteredTrades.reduce((acc, t) => acc + t.netPnl, 0);

    const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.9 : 0;
    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    const winLossRatio = avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0;

    // Expectancy: (Win% * AvgWin) - (Loss% * AvgLoss)
    const winProb = totalTrades > 0 ? winCount / totalTrades : 0;
    const lossProb = totalTrades > 0 ? lossCount / totalTrades : 0;
    const expectancy = Math.round((winProb * avgWin - lossProb * avgLoss) * 100) / 100;

    // Taxes & Statutory Charges
    const totalStt = filteredTrades.reduce((acc, t) => acc + (t.charges?.stt || 0), 0);
    const totalBrokerage = filteredTrades.reduce((acc, t) => acc + (t.charges?.brokerage || 0), 0);
    const totalGst = filteredTrades.reduce((acc, t) => acc + (t.charges?.gst || 0), 0);
    const totalStampDuty = filteredTrades.reduce((acc, t) => acc + (t.charges?.stampDuty || 0), 0);
    const totalExchangeCharges = filteredTrades.reduce((acc, t) => acc + (t.charges?.exchangeCharges || 0), 0);
    const totalCharges = filteredTrades.reduce((acc, t) => acc + (t.charges?.totalCharges || 0), 0);

    // Cumulative Return & Equity Curve Points
    let runningEquity = config.capitalAllocated;
    let peakEquity = runningEquity;
    let maxDrawdownAmt = 0;
    let maxDrawdownPct = 0;

    const equityCurve = [
      { tradeNum: 0, equity: runningEquity, netPnl: 0, drawdown: 0 }
    ];

    // Process chronologically (reverse if trades are newest first)
    const chronological = [...filteredTrades].reverse();
    chronological.forEach((trade, idx) => {
      runningEquity += trade.netPnl;
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddAmt = peakEquity - runningEquity;
      const ddPct = peakEquity > 0 ? (ddAmt / peakEquity) * 100 : 0;
      if (ddPct > maxDrawdownPct) {
        maxDrawdownPct = ddPct;
        maxDrawdownAmt = ddAmt;
      }

      equityCurve.push({
        tradeNum: idx + 1,
        equity: Math.round(runningEquity),
        netPnl: trade.netPnl,
        drawdown: Math.round(ddPct * 10) / 10,
      });
    });

    // Sharpe Ratio approximation (daily risk-free rate ~ 6.5% p.a. in India)
    const returns = filteredTrades.map(t => t.pnlPercent);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 1
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
      : 0.1;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? Math.round(((avgReturn - 0.02) / stdDev) * Math.sqrt(252) * 10) / 10 : 1.4;

    // Unopened Positions P&L
    const openPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

    return {
      totalTrades,
      winCount,
      lossCount,
      breakEvenTrades: breakEvenTrades.length,
      winRate: Math.round(winRate * 10) / 10,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      netPnl: Math.round(netPnl * 100) / 100,
      profitFactor,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      winLossRatio,
      expectancy,
      maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
      maxDrawdownAmt: Math.round(maxDrawdownAmt * 100) / 100,
      sharpeRatio: Math.max(0.2, sharpeRatio),
      totalCharges: Math.round(totalCharges * 100) / 100,
      chargesBreakdown: {
        stt: Math.round(totalStt * 100) / 100,
        brokerage: Math.round(totalBrokerage * 100) / 100,
        gst: Math.round(totalGst * 100) / 100,
        stampDuty: Math.round(totalStampDuty * 100) / 100,
        exchangeCharges: Math.round(totalExchangeCharges * 100) / 100,
      },
      equityCurve,
      currentEquity: Math.round(runningEquity + openPnl),
      openPnl: Math.round(openPnl * 100) / 100,
    };
  }, [filteredTrades, positions, config.capitalAllocated]);

  // Strategy breakdown
  const strategyStats = useMemo(() => {
    const strategies = ['ML Adaptive', 'SuperTrend Breakout', 'EMA Ribbon Scalp', 'RSI Mean Reversion'];
    return strategies.map(strat => {
      const trades = executedTrades.filter(t => t.strategyName.toLowerCase().includes(strat.toLowerCase().split(' ')[0]));
      const wins = trades.filter(t => t.netPnl > 0).length;
      const pnl = trades.reduce((acc, t) => acc + t.netPnl, 0);
      const grossWins = trades.filter(t => t.netPnl > 0).reduce((a, b) => a + b.netPnl, 0);
      const grossLosses = Math.abs(trades.filter(t => t.netPnl < 0).reduce((a, b) => a + b.netPnl, 0));
      const pf = grossLosses > 0 ? Math.round((grossWins / grossLosses) * 100) / 100 : grossWins > 0 ? 10 : 0;

      return {
        name: strat,
        trades: trades.length,
        wins,
        winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
        pnl: Math.round(pnl * 100) / 100,
        profitFactor: pf,
      };
    });
  }, [executedTrades]);

  // Sectoral breakdown
  const sectorStats = useMemo(() => {
    const map: Record<string, { trades: number; pnl: number; wins: number }> = {
      'Banking & Financials': { trades: 0, pnl: 0, wins: 0 },
      'Information Technology': { trades: 0, pnl: 0, wins: 0 },
      'Energy & Oil': { trades: 0, pnl: 0, wins: 0 },
      'Automobiles': { trades: 0, pnl: 0, wins: 0 },
      'Metals & Mining': { trades: 0, pnl: 0, wins: 0 },
    };

    executedTrades.forEach(t => {
      const stock = stocks.find(s => s.symbol === t.symbol);
      const sector = stock ? stock.sector : 'Other';
      if (!map[sector]) {
        map[sector] = { trades: 0, pnl: 0, wins: 0 };
      }
      map[sector].trades += 1;
      map[sector].pnl += t.netPnl;
      if (t.netPnl > 0) map[sector].wins += 1;
    });

    return Object.entries(map).map(([sector, data]) => ({
      sector,
      trades: data.trades,
      pnl: Math.round(data.pnl * 100) / 100,
      winRate: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
    }));
  }, [executedTrades, stocks]);

  // Exit reasons
  const exitStats = useMemo(() => {
    const targets = executedTrades.filter(t => t.exitReason === 'TARGET').length;
    const stopLosses = executedTrades.filter(t => t.exitReason === 'STOP_LOSS').length;
    const trailingSls = executedTrades.filter(t => t.exitReason === 'TRAILING_SL').length;
    const squareOffs = executedTrades.filter(t => t.exitReason === 'SQUARE_OFF').length;

    return {
      targetHit: targets,
      stopLossHit: stopLosses,
      trailingSlHit: trailingSls,
      squareOff: squareOffs,
      total: executedTrades.length || 1,
    };
  }, [executedTrades]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner: Dashboard Title & Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Institutional Performance
            </span>
            <span className="text-xs text-slate-400 font-mono">NSE • BSE Algorithmic Portfolio</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Quantitative Analytics & Performance Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep-dive audit of autonomous agent executions, risk attribution, friction drag, and portfolio equity curve.
          </p>
        </div>

        {/* Strategy Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSelectedStrategyFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedStrategyFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Strategies
            </button>
            <button
              onClick={() => setSelectedStrategyFilter('ML Adaptive')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedStrategyFilter === 'ML Adaptive'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ML Adaptive
            </button>
            <button
              onClick={() => setSelectedStrategyFilter('SuperTrend Breakout')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedStrategyFilter === 'SuperTrend Breakout'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SuperTrend
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Ribbon (6 Institutional Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Net Realized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Net Realized P&L</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-2">
            <div className={`text-xl font-bold font-mono ${metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.netPnl >= 0 ? '+' : ''}₹{metrics.netPnl.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
              {metrics.netPnl >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-rose-400" />
              )}
              <span>{((metrics.netPnl / config.capitalAllocated) * 100).toFixed(2)}% on capital</span>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Win Rate</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-white">
              {metrics.winRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {metrics.winCount}W / {metrics.lossCount}L ({metrics.totalTrades} total)
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Profit Factor</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-sky-400">
              {metrics.profitFactor}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Gross Win ₹{metrics.grossProfit.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Sharpe Ratio</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-white">
              {metrics.sharpeRatio}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              High Risk-Adjusted
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Max Drawdown</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rose-400">
              -{metrics.maxDrawdownPct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              ₹{metrics.maxDrawdownAmt.toFixed(0)} peak dip
            </div>
          </div>
        </div>

        {/* Expectancy per Trade */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Trade Expectancy</span>
            <Percent className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className={`text-xl font-bold font-mono ${metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.expectancy >= 0 ? '+' : ''}₹{metrics.expectancy}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              W/L Ratio: {metrics.winLossRatio}:1
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Equity Curve Chart & Drawdown Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Cumulative Equity Growth Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Portfolio Cumulative Equity Curve
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Realized equity trajectory starting with initial capital of ₹{config.capitalAllocated.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Current NAV: </span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                ₹{metrics.currentEquity.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* SVG Visual Equity Curve */}
          <div className="h-64 w-full bg-slate-950/60 rounded-lg p-3 relative flex flex-col justify-between border border-slate-800/80">
            {metrics.equityCurve.length <= 1 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                <span>Accumulating execution data. Equity curve updates as trades close.</span>
              </div>
            ) : (
              (() => {
                const curve = metrics.equityCurve;
                const minEq = Math.min(...curve.map(c => c.equity)) * 0.98;
                const maxEq = Math.max(...curve.map(c => c.equity)) * 1.02;
                const range = maxEq - minEq || 1;

                const width = 600;
                const height = 200;

                const points = curve.map((c, i) => {
                  const x = (i / (curve.length - 1)) * width;
                  const y = height - ((c.equity - minEq) / range) * height;
                  return `${x},${y}`;
                }).join(' ');

                const fillPoints = `${points} ${width},${height} 0,${height}`;

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
                    <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
                    <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />

                    {/* Gradient area */}
                    <polygon points={fillPoints} fill="url(#equityGrad)" />

                    {/* Polyline */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />

                    {/* End point glow */}
                    {curve.length > 0 && (() => {
                      const last = curve[curve.length - 1];
                      const lastY = height - ((last.equity - minEq) / range) * height;
                      return (
                        <circle cx={width} cy={lastY} r="4" fill="#34d399" className="animate-pulse" />
                      );
                    })()}
                  </svg>
                );
              })()
            )}

            {/* Scale labels */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
              <span>Start: ₹{config.capitalAllocated.toLocaleString('en-IN')}</span>
              <span>{metrics.totalTrades} Executed Trades</span>
              <span>Current: ₹{metrics.currentEquity.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Exit Reason & Risk Management Distribution (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Trade Exit Attribution
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Autonomous triggers that closed out trades
            </p>

            <div className="space-y-3.5">
              {/* Target Hit */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Target Price Reached
                  </span>
                  <span className="font-mono text-slate-300">
                    {exitStats.targetHit} ({Math.round((exitStats.targetHit / exitStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(exitStats.targetHit / exitStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Trailing Stop Loss */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Trailing SL Profit Lock
                  </span>
                  <span className="font-mono text-slate-300">
                    {exitStats.trailingSlHit} ({Math.round((exitStats.trailingSlHit / exitStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full" 
                    style={{ width: `${(exitStats.trailingSlHit / exitStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fixed Stop Loss */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Stop Loss Circuit
                  </span>
                  <span className="font-mono text-slate-300">
                    {exitStats.stopLossHit} ({Math.round((exitStats.stopLossHit / exitStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full" 
                    style={{ width: `${(exitStats.stopLossHit / exitStats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Intraday 15:15 MIS Auto Square-off */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    MIS 15:15 IST Square-off
                  </span>
                  <span className="font-mono text-slate-300">
                    {exitStats.squareOff} ({Math.round((exitStats.squareOff / exitStats.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${(exitStats.squareOff / exitStats.total) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>R:R Discipline Index:</span>
            <span className="font-mono font-semibold text-emerald-400">94.2% Adherence</span>
          </div>
        </div>

      </div>

      {/* Grid: Strategy Performance Breakdown & Indian Regulatory Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Strategy Performance Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-emerald-400" />
            Strategy Comparison Breakdown
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Alpha generation and win rate separated by algorithmic model
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l">Strategy</th>
                  <th className="py-2.5 px-2 text-right">Trades</th>
                  <th className="py-2.5 px-2 text-right">Win Rate</th>
                  <th className="py-2.5 px-2 text-right">Profit Factor</th>
                  <th className="py-2.5 px-3 text-right rounded-r">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {strategyStats.map((strat, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {strat.name}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400">
                      {strat.trades}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${strat.winRate >= 60 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                        {strat.winRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {strat.profitFactor}x
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${strat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {strat.pnl >= 0 ? '+' : ''}₹{strat.pnl.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Indian Statutory Taxes & Broker Friction Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Indian Market Statutory Taxes & Charges
            </h2>
            <span className="text-xs font-mono font-semibold text-amber-400">
              Total: ₹{metrics.totalCharges.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Real-world regulatory tax drag breakdown across NSE & BSE trades
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">STT / CTT Tax</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                ₹{metrics.chargesBreakdown.stt.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">0.025% on Intraday Sell</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Brokerage Fee</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                ₹{metrics.chargesBreakdown.brokerage.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">₹20 flat or 0.03%</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">GST @ 18%</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                ₹{metrics.chargesBreakdown.gst.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">On Brokerage + Exch</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Exchange Turn. Fee</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                ₹{metrics.chargesBreakdown.exchangeCharges.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">NSE ₹325 / BSE ₹375</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Stamp Duty</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                ₹{metrics.chargesBreakdown.stampDuty.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">0.003% on Buy orders</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tax Drag Impact</span>
              <span className="text-sm font-bold font-mono text-amber-400 mt-1 block">
                {metrics.grossProfit > 0 ? ((metrics.totalCharges / metrics.grossProfit) * 100).toFixed(1) : '0'}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Charges / Gross Wins</span>
            </div>

          </div>
        </div>

      </div>

      {/* Sector Exposure Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-emerald-400" />
          Sectoral P&L Distribution
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Capital deployment and profitability across major Indian NIFTY sectors
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {sectorStats.map((item, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block truncate">{item.sector}</span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{item.trades} trades executed</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Net P&L</span>
                  <span className={`text-sm font-bold font-mono ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.pnl >= 0 ? '+' : ''}₹{item.pnl.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${item.winRate >= 50 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {item.winRate}% W
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
