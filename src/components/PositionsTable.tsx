import React from 'react';
import { 
  Briefcase, 
  XOctagon, 
  Shield, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight
} from 'lucide-react';
import { ActivePosition } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface PositionsTableProps {
  positions: ActivePosition[];
  onSquareOffPosition: (positionId: string) => void;
  onSquareOffAll: () => void;
  onSelectPositionSymbol: (symbol: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onSquareOffPosition,
  onSquareOffAll,
  onSelectPositionSymbol,
}) => {
  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-white">Active Positions (Open Trades)</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {positions.length}
          </span>
        </div>

        {positions.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono">
              <span className="text-slate-400 mr-1.5">Unrealized Total:</span>
              <span className={`font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(totalPnl, true)}
              </span>
            </div>
            <button
              onClick={onSquareOffAll}
              className="px-2.5 py-1 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/30 transition-all font-semibold flex items-center gap-1"
            >
              <XOctagon className="w-3.5 h-3.5" />
              Square Off All
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Instrument</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Avg Entry</th>
              <th className="py-2.5 px-3 text-right">LTP</th>
              <th className="py-2.5 px-3 text-right">Stop Loss</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-right">Unrealized P&L</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {positions.map((pos) => {
              const isProfit = pos.pnl >= 0;
              const isBuy = pos.side === 'BUY';

              return (
                <tr 
                  key={pos.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Symbol & Exchange */}
                  <td className="py-2.5 px-3">
                    <div 
                      onClick={() => onSelectPositionSymbol(pos.symbol)}
                      className="cursor-pointer group flex items-center gap-1.5"
                    >
                      <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {pos.symbol}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {pos.exchange}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 text-sky-400">
                        {pos.orderType}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                      {pos.strategyName} • ML: {pos.mlConfidence}%
                    </div>
                  </td>

                  {/* Side */}
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {pos.side}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {pos.quantity}
                  </td>

                  {/* Avg Entry Price */}
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatINR(pos.avgPrice)}
                  </td>

                  {/* LTP */}
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatINR(pos.ltp)}
                  </td>

                  {/* Stop Loss (with Trailing indicator) */}
                  <td className="py-2.5 px-3 text-right text-rose-400">
                    <div className="flex items-center justify-end gap-1">
                      <Shield className="w-3 h-3 text-rose-400" />
                      <span>{pos.trailingSl ? pos.trailingSl.toFixed(2) : pos.stopLoss.toFixed(2)}</span>
                    </div>
                    {pos.trailingSl && pos.trailingSl !== pos.stopLoss && (
                      <span className="text-[9px] text-amber-400 block font-sans">
                        Trailing Active
                      </span>
                    )}
                  </td>

                  {/* Target Price */}
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    <div className="flex items-center justify-end gap-1">
                      <Target className="w-3 h-3 text-emerald-400" />
                      <span>{pos.targetPrice.toFixed(2)}</span>
                    </div>
                  </td>

                  {/* Unrealized P&L */}
                  <td className="py-2.5 px-3 text-right font-bold">
                    <div className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatINR(pos.pnl, true)}
                    </div>
                    <div className={`text-[10px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                    </div>
                  </td>

                  {/* Square Off Button */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSquareOffPosition(pos.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 transition-all text-[10px] border border-slate-700"
                      title="Square off position at current market price"
                    >
                      Square Off
                    </button>
                  </td>
                </tr>
              );
            })}

            {positions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                  No active open positions. The autonomous trading agent will trigger orders once high-conviction ML signals & technical confirmations align.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
