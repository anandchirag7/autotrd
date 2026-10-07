import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { StockQuote, Exchange } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface WatchlistPanelProps {
  stocks: StockQuote[];
  selectedSymbol: string;
  onSelectStock: (stock: StockQuote) => void;
  onForceAutonomousScan?: (symbol: string) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onForceAutonomousScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExchange, setFilterExchange] = useState<'ALL' | Exchange>('ALL');
  const [onlyHighConviction, setOnlyHighConviction] = useState(false);

  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExchange = filterExchange === 'ALL' || s.exchange === filterExchange;
    const matchesConviction = !onlyHighConviction || s.mlConfidence >= 75;
    return matchesSearch && matchesExchange && matchesConviction;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[520px] shadow-sm">
      
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white">Indian Equities Watchlist</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {filteredStocks.length}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TICK FEED
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search NSE/BSE symbols (e.g. RELIANCE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Exchange Filter Pills */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            {(['ALL', 'NSE', 'BSE'] as const).map(ex => (
              <button
                key={ex}
                onClick={() => setFilterExchange(ex)}
                className={`px-2 py-0.5 rounded font-mono transition-all ${
                  filterExchange === ex 
                    ? 'bg-slate-700 text-white font-medium' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnlyHighConviction(!onlyHighConviction)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              onlyHighConviction 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>ML &gt;75%</span>
          </button>
        </div>
      </div>

      {/* Stocks List (Scrollable) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
        {filteredStocks.map(stock => {
          const isSelected = stock.symbol === selectedSymbol;
          const isUp = stock.change >= 0;

          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className={`p-2.5 cursor-pointer transition-all flex items-center justify-between ${
                isSelected 
                  ? 'bg-slate-800/90 border-l-2 border-emerald-500' 
                  : 'hover:bg-slate-800/50'
              }`}
            >
              {/* Symbol & Sector */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white tracking-tight">{stock.symbol}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-mono text-slate-400 bg-slate-950 border border-slate-800">
                    {stock.exchange}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>RSI: {stock.rsi}</span>
                  <span>•</span>
                  <span className={stock.supertrendSignal === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                    ST {stock.supertrendSignal}
                  </span>
                </div>
              </div>

              {/* Price & ML Conviction */}
              <div className="text-right flex flex-col items-end">
                <div className="text-xs font-bold font-mono text-white">
                  {formatINR(stock.ltp)}
                </div>
                <div className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>

                {/* ML Indicator Pill */}
                <div className="mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium inline-flex items-center gap-0.5 ${
                    stock.mlSignal.includes('BUY')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : stock.mlSignal.includes('SELL')
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {stock.mlSignal.includes('STRONG') ? '⚡ ' : ''}{stock.mlSignal.replace('_', ' ')} {stock.mlConfidence}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No instruments match the selected filter.
          </div>
        )}
      </div>

    </div>
  );
};
