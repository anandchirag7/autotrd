import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  ShieldCheck, 
  Percent,
  ReceiptText
} from 'lucide-react';
import { formatINR } from '../utils/technicalIndicators';
import { ActivePosition, ExecutedTrade, BrokerAccount, BotConfig } from '../types';

interface MetricCardsProps {
  positions: ActivePosition[];
  executedTrades: ExecutedTrade[];
  brokerAccount: BrokerAccount;
  config: BotConfig;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  positions,
  executedTrades,
  brokerAccount,
  config,
}) => {
  // Realized Net PnL from closed trades today
  const realizedNetPnl = executedTrades.reduce((acc, t) => acc + t.netPnl, 0);
  
  // Total charges paid so far today (STT, GST, etc)
  const totalChargesPaid = executedTrades.reduce((acc, t) => acc + t.charges.totalCharges, 0);

  // Unrealized PnL from live open positions
  const unrealizedPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  // Total Net Day PnL = Realized + Unrealized
  const totalDayPnl = realizedNetPnl + unrealizedPnl;
  const initialCapital = brokerAccount.funds.totalMargin || config.capitalAllocated;
  const dayPnlPercent = initialCapital > 0 ? (totalDayPnl / initialCapital) * 100 : 0;

  // Win rate metrics
  const closedCount = executedTrades.length;
  const winningTrades = executedTrades.filter(t => t.netPnl > 0).length;
  const winRate = closedCount > 0 ? Math.round((winningTrades / closedCount) * 100) : 0;

  const grossWins = executedTrades.filter(t => t.grossPnl > 0).reduce((acc, t) => acc + t.grossPnl, 0);
  const grossLosses = Math.abs(executedTrades.filter(t => t.grossPnl < 0).reduce((acc, t) => acc + t.grossPnl, 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? '99.0' : '0.00';

  // Drawdown calculation vs Max Daily Loss Limit
  const currentDrawdown = totalDayPnl < 0 ? Math.abs(totalDayPnl) : 0;
  const drawdownLimit = config.dailyMaxLossLimit || 5000;
  const drawdownPercentOfLimit = Math.min(100, Math.round((currentDrawdown / drawdownLimit) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      
      {/* 1. Net Day P&L */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Total Day P&L (Net)</span>
          {totalDayPnl >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
        <div>
          <div className={`text-lg font-bold font-mono tracking-tight ${totalDayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatINR(totalDayPnl, true)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
            <span className={dayPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {dayPnlPercent >= 0 ? '+' : ''}{dayPnlPercent.toFixed(2)}%
            </span>
            <span>on capital</span>
          </div>
        </div>
      </div>

      {/* 2. Unrealized Floating P&L */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Floating MTM P&L</span>
          <Target className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div>
          <div className={`text-lg font-bold font-mono tracking-tight ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatINR(unrealizedPnl, true)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>{positions.length} Open {positions.length === 1 ? 'Position' : 'Positions'}</span>
            <span className="font-mono text-slate-300">
              {positions.length > 0 ? (unrealizedPnl >= 0 ? 'IN PROFIT' : 'FLOATING LOSS') : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Available Margin */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Available Margin</span>
          <Wallet className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div>
          <div className="text-lg font-bold font-mono tracking-tight text-white">
            {formatINR(brokerAccount.funds.availableMargin)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>Used: {formatINR(brokerAccount.funds.utilizedMargin)}</span>
            <span className="text-[10px] uppercase font-semibold text-sky-400">
              {config.tradingMode === 'paper' ? 'Virtual' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Win Rate & Trades */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Win Rate</span>
          <Percent className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <div className="text-lg font-bold font-mono tracking-tight text-white flex items-baseline gap-1.5">
            <span>{winRate}%</span>
            <span className="text-xs font-normal text-slate-400">({winningTrades}/{closedCount})</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>Profit Factor:</span>
            <span className="font-mono text-emerald-400 font-semibold">{profitFactor}</span>
          </div>
        </div>
      </div>

      {/* 5. Daily Drawdown Guard (Risk Protection) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Drawdown Guard</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold font-mono text-slate-200">
              {formatINR(currentDrawdown)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Limit: {formatINR(drawdownLimit)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                drawdownPercentOfLimit > 80 
                  ? 'bg-rose-500' 
                  : drawdownPercentOfLimit > 50 
                  ? 'bg-amber-400' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${drawdownPercentOfLimit}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
            <span>Circuit Breaker</span>
            <span className="font-mono text-slate-300">{drawdownPercentOfLimit}% Used</span>
          </div>
        </div>
      </div>

      {/* 6. Statutory Charges & Taxes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Taxes & Brokerage</span>
          <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div>
          <div className="text-lg font-bold font-mono tracking-tight text-slate-300">
            {formatINR(totalChargesPaid)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>STT, GST & SEBI</span>
            <span className="text-slate-400 font-mono">{executedTrades.length} Trades</span>
          </div>
        </div>
      </div>

    </div>
  );
};
