import React, { useState } from 'react';
import { 
  FileText, 
  ArrowDownToLine, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Receipt
} from 'lucide-react';
import { ExecutedTrade } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface OrderBookTableProps {
  executedTrades: ExecutedTrade[];
}

export const OrderBookTable: React.FC<OrderBookTableProps> = ({ executedTrades }) => {
  const [selectedTrade, setSelectedTrade] = useState<ExecutedTrade | null>(null);

  const exportCSV = () => {
    if (executedTrades.length === 0) return;
    const headers = ['Order ID', 'Symbol', 'Exchange', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'Net PnL', 'Charges', 'Exit Reason', 'Time'];
    const rows = executedTrades.map(t => [
      t.orderId,
      t.symbol,
      t.exchange,
      t.side,
      t.quantity,
      t.entryPrice,
      t.exitPrice,
      t.netPnl,
      t.charges.totalCharges,
      t.exitReason,
      t.exitTime,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trade_book_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-sm text-white">Trade Book & Executed Orders</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {executedTrades.length}
          </span>
        </div>

        {executedTrades.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-all font-mono"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Order ID & Time</th>
              <th className="py-2.5 px-3">Instrument</th>
              <th className="py-2.5 px-3">Side</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Entry</th>
              <th className="py-2.5 px-3 text-right">Exit</th>
              <th className="py-2.5 px-3 text-right">Gross P&L</th>
              <th className="py-2.5 px-3 text-right">Taxes/Charges</th>
              <th className="py-2.5 px-3 text-right">Net P&L</th>
              <th className="py-2.5 px-3 text-center">Trigger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {executedTrades.map((trade) => {
              const isProfit = trade.netPnl >= 0;

              return (
                <tr 
                  key={trade.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Order ID & Time */}
                  <td className="py-2.5 px-3">
                    <div className="font-mono text-slate-300 font-semibold">{trade.orderId}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{trade.exitTime}</div>
                  </td>

                  {/* Instrument */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{trade.symbol}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {trade.exchange}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">{trade.strategyName}</div>
                  </td>

                  {/* Side */}
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      trade.side === 'BUY' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {trade.side}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {trade.quantity}
                  </td>

                  {/* Entry */}
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatINR(trade.entryPrice)}
                  </td>

                  {/* Exit */}
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {formatINR(trade.exitPrice)}
                  </td>

                  {/* Gross P&L */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {formatINR(trade.grossPnl, true)}
                  </td>

                  {/* Taxes & Charges */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    <button
                      onClick={() => setSelectedTrade(trade)}
                      className="hover:text-sky-400 transition-colors inline-flex items-center gap-1 underline underline-offset-2 decoration-slate-600"
                      title="View Indian STT, GST and Brokerage breakdown"
                    >
                      <Receipt className="w-3 h-3 text-slate-500" />
                      <span>{formatINR(trade.charges.totalCharges)}</span>
                    </button>
                  </td>

                  {/* Net P&L */}
                  <td className="py-2.5 px-3 text-right font-bold">
                    <div className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatINR(trade.netPnl, true)}
                    </div>
                    <div className={`text-[10px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                    </div>
                  </td>

                  {/* Trigger Reason */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase ${
                      trade.exitReason === 'TARGET' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : trade.exitReason === 'TRAILING_SL'
                        ? 'bg-sky-500/20 text-sky-300'
                        : trade.exitReason === 'STOP_LOSS'
                        ? 'bg-rose-500/20 text-rose-300'
                        : trade.exitReason === 'SQUARE_OFF'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {trade.exitReason.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}

            {executedTrades.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                  No completed trades yet today. Executed orders and P&L with Indian statutory charges will be registered here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Indian Charges Breakdown Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-white">Statutory Charges & Brokerage</span>
              <button 
                onClick={() => setSelectedTrade(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="py-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Brokerage:</span>
                <span>{formatINR(selectedTrade.charges.brokerage)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>STT (Securities Txn Tax):</span>
                <span>{formatINR(selectedTrade.charges.stt)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Exchange Txn Charges:</span>
                <span>{formatINR(selectedTrade.charges.exchangeCharges)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST (18%):</span>
                <span>{formatINR(selectedTrade.charges.gst)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>SEBI Turnover Charges:</span>
                <span>{formatINR(selectedTrade.charges.sebiTurnover)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Stamp Duty:</span>
                <span>{formatINR(selectedTrade.charges.stampDuty)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Total Deductions:</span>
                <span className="text-amber-400">{formatINR(selectedTrade.charges.totalCharges)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
