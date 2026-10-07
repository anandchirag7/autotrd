import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Trash2,
  Filter
} from 'lucide-react';
import { TradeAlert } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface LiveAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: TradeAlert[];
  onClearAlerts: () => void;
}

export const LiveAlertsDrawer: React.FC<LiveAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TRADES') return a.type === 'BUY' || a.type === 'SELL' || a.type === 'TARGET_HIT' || a.type === 'SL_HIT';
    if (filterType === 'RISK') return a.type === 'CIRCUIT_BREAKER' || a.type === 'SQUARE_OFF' || a.type === 'STRATEGY_SHIFT';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white">Real-Time Autonomous Alerts</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {alerts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <button
                onClick={onClearAlerts}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Clear all alerts"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Filter:</span>
          {(['ALL', 'TRADES', 'RISK'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all ${
                filterType === f 
                  ? 'bg-slate-700 text-white font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Alerts Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredAlerts.map((alert) => {
            const isBuy = alert.type === 'BUY';
            const isTarget = alert.type === 'TARGET_HIT';
            const isSl = alert.type === 'SL_HIT';
            const isCircuit = alert.type === 'CIRCUIT_BREAKER';
            const isShift = alert.type === 'STRATEGY_SHIFT';

            return (
              <div 
                key={alert.id}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  isTarget 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                    : isSl 
                    ? 'bg-rose-950/20 border-rose-500/40 text-slate-200' 
                    : isCircuit
                    ? 'bg-amber-950/20 border-amber-500/40 text-slate-200'
                    : isShift
                    ? 'bg-indigo-950/20 border-indigo-500/40 text-slate-200'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isTarget && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isSl && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    {isCircuit && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                    {isBuy && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {!isBuy && !isTarget && !isSl && !isCircuit && <TrendingDown className="w-3.5 h-3.5 text-sky-400" />}
                    
                    <span className="text-white">{alert.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {alert.message}
                </p>

                {alert.pnl !== undefined && (
                  <div className="mt-1.5 font-mono font-bold flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">Booked P&L:</span>
                    <span className={alert.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatINR(alert.pnl, true)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs">
              No real-time alerts logged yet. Orders, Stop-Loss triggers and risk notifications will appear here.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
