import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';
import { BacktestConfig, BacktestResult, StrategyType } from '../types';
import { runBacktest } from '../utils/backtestEngine';
import { formatINR } from '../utils/technicalIndicators';

export const BacktestingEngine: React.FC = () => {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'NIFTY 50',
    strategy: 'ml_adaptive',
    timeframe: '15m',
    period: '6M',
    initialCapital: 500000,
    riskPerTradePercent: 1.5,
    stopLossPercent: 0.8,
    targetPercent: 2.0,
    slippagePercent: 0.05,
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(() => runBacktest(config));

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runBacktest(config);
      setResult(res);
      setIsRunning(false);
    }, 450);
  };

  // Dimensions for Equity Curve SVG
  const chartHeight = 240;
  const chartWidth = 720;
  const padding = { top: 20, right: 60, bottom: 25, left: 10 };

  // Calculate curve points
  const points = result?.equityCurve || [];
  const minEquity = points.length > 0 ? Math.min(...points.map(p => Math.min(p.equity, p.benchmark))) * 0.98 : 450000;
  const maxEquity = points.length > 0 ? Math.max(...points.map(p => Math.max(p.equity, p.benchmark))) * 1.02 : 650000;
  const range = maxEquity - minEquity || 1;

  const getY = (val: number) => {
    const norm = (val - minEquity) / range;
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - norm);
  };

  const getX = (index: number) => {
    return padding.left + (index / (points.length > 1 ? points.length - 1 : 1)) * (chartWidth - padding.left - padding.right);
  };

  const botPath = points.length > 1 ? points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.equity);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '') : '';

  const benchmarkPath = points.length > 1 ? points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.benchmark);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '') : '';

  return (
    <div className="space-y-4">
      
      {/* Top Configuration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm text-white">NSE & BSE Historical Strategy Backtester</h2>
              <p className="text-xs text-slate-400">Evaluate strategy efficiency, drawdowns, and net profitability against historical data</p>
            </div>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-sm ${
              isRunning ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Simulation...' : 'Run Historical Backtest'}</span>
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Symbol */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Instrument</label>
            <select
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="NIFTY 50">NIFTY 50 (Index)</option>
              <option value="BANKNIFTY">BANKNIFTY (Index)</option>
              <option value="RELIANCE">RELIANCE (NSE)</option>
              <option value="TCS">TCS (NSE)</option>
              <option value="HDFCBANK">HDFCBANK (NSE)</option>
              <option value="INFY">INFY (NSE)</option>
              <option value="TATAMOTORS">TATAMOTORS (NSE)</option>
              <option value="ICICIBANK">ICICIBANK (NSE)</option>
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Strategy</label>
            <select
              value={config.strategy}
              onChange={(e) => setConfig({ ...config, strategy: e.target.value as StrategyType })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="ml_adaptive">ML Adaptive Ensemble</option>
              <option value="supertrend_breakout">Supertrend (10, 3) Breakout</option>
              <option value="ema_ribbon_scalp">EMA Ribbon (9/21) Scalp</option>
              <option value="mean_reversion_rsi">RSI Mean Reversion</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Backtest Period</label>
            <select
              value={config.period}
              onChange={(e) => setConfig({ ...config, period: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
              <option value="3Y">3 Years</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Bar Timeframe</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1D">Daily (1D)</option>
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Initial Capital (₹)</label>
            <input
              type="number"
              step="50000"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Risk per Trade */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Risk / Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={config.riskPerTradePercent}
              onChange={(e) => setConfig({ ...config, riskPerTradePercent: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* Total Return */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Net P&L Return</span>
              <div className={`text-base font-bold font-mono ${result.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(result.totalPnl, true)}
              </div>
              <span className={`text-[10px] font-mono ${result.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.totalReturnPercent >= 0 ? '+' : ''}{result.totalReturnPercent.toFixed(2)}%
              </span>
            </div>

            {/* Win Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Win Rate</span>
              <div className="text-base font-bold font-mono text-white">
                {result.winRate}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.winningTrades}W / {result.losingTrades}L ({result.totalTrades} total)
              </span>
            </div>

            {/* Profit Factor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Profit Factor</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                {result.profitFactor}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Gross Win / Loss
              </span>
            </div>

            {/* Max Drawdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Max Drawdown</span>
              <div className="text-base font-bold font-mono text-rose-400">
                -{result.maxDrawdownPercent}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Peak to trough
              </span>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Sharpe Ratio</span>
              <div className="text-base font-bold font-mono text-white">
                {result.sharpeRatio}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Risk-adjusted return
              </span>
            </div>

            {/* Sortino Ratio */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Sortino Ratio</span>
              <div className="text-base font-bold font-mono text-white">
                {result.sortinoRatio}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Downside volatility
              </span>
            </div>

            {/* Avg Win / Loss */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Avg Win vs Loss</span>
              <div className="text-xs font-mono font-bold text-emerald-400">
                +{formatINR(result.avgWin)}
              </div>
              <div className="text-xs font-mono text-rose-400">
                -{formatINR(result.avgLoss)}
              </div>
            </div>

          </div>

          {/* Equity Curve Comparison Visualization */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Cumulative Equity vs Buy & Hold Benchmark</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-1 bg-emerald-400 rounded-full" /> Autonomous Bot Strategy
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-1 bg-slate-500 rounded-full" /> Buy & Hold Benchmark
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full h-[240px] bg-slate-950 rounded-lg overflow-hidden relative">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Horizontal price grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const val = minEquity + range * (1 - pct);
                  const y = padding.top + (chartHeight - padding.top - padding.bottom) * pct;
                  return (
                    <g key={pct}>
                      <line 
                        x1={padding.left} 
                        y1={y} 
                        x2={chartWidth - padding.right} 
                        y2={y} 
                        stroke="#1e293b" 
                        strokeDasharray="2 2"
                      />
                      <text 
                        x={chartWidth - padding.right + 4} 
                        y={y + 3} 
                        fill="#64748b" 
                        fontSize="8" 
                        fontFamily="monospace"
                      >
                        ₹{(val / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Line */}
                <path d={benchmarkPath} fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />

                {/* Bot Strategy Equity Line */}
                <path d={botPath} fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Trade History Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Backtested Trade Executions Log</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.trades.length} Trades Simulated with Indian Taxes & Brokerage
              </span>
            </div>

            <div className="overflow-x-auto max-h-[320px] custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Side</th>
                    <th className="py-2 px-3 text-right">Entry</th>
                    <th className="py-2 px-3 text-right">Exit</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Net P&L (₹)</th>
                    <th className="py-2 px-3 text-right">Return %</th>
                    <th className="py-2 px-3 text-right">Account Equity</th>
                    <th className="py-2 px-3 text-center">Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {result.trades.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400">{t.date}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          t.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatINR(t.entryPrice)}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{formatINR(t.exitPrice)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{t.quantity}</td>
                      <td className={`py-2 px-3 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(t.pnl, true)}
                      </td>
                      <td className={`py-2 px-3 text-right ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-right text-white font-medium">{formatINR(t.cumulativeEquity)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-sans font-medium uppercase ${
                          t.exitReason === 'TARGET' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {t.exitReason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
