import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart2, 
  Eye, 
  Maximize2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Sparkles
} from 'lucide-react';
import { StockQuote, ActivePosition, Candle } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface CandlestickChartProps {
  stock: StockQuote;
  activePosition?: ActivePosition | null;
  onSelectTimeframe: (tf: string) => void;
  selectedTimeframe: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  stock,
  activePosition,
  onSelectTimeframe,
  selectedTimeframe,
}) => {
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showSupertrend, setShowSupertrend] = useState<boolean>(true);
  const [showVWAP, setShowVWAP] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const candles = stock.candles || [];

  // Dimensions
  const chartHeight = 340;
  const volumeHeight = 60;
  const padding = { top: 20, right: 65, bottom: 25, left: 10 };
  const totalWidth = 720; // viewBox width

  // Price Scale Calculation
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 100, maxPrice: 110, priceRange: 10, maxVolume: 1000 };
    }

    let min = Infinity;
    let max = -Infinity;
    let volMax = 0;

    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > volMax) volMax = c.volume;

      // Include active position SL and target in range if applicable
      if (activePosition) {
        if (activePosition.stopLoss < min) min = activePosition.stopLoss;
        if (activePosition.targetPrice > max) max = activePosition.targetPrice;
      }
    });

    const buffer = (max - min) * 0.08 || 2;
    return {
      minPrice: min - buffer,
      maxPrice: max + buffer,
      priceRange: (max + buffer) - (min - buffer) || 1,
      maxVolume: volMax || 1,
    };
  }, [candles, activePosition]);

  const candlePlotAreaHeight = chartHeight - padding.top - padding.bottom - (showVolume ? volumeHeight : 0);
  const candleWidth = Math.max(3, Math.min(14, (totalWidth - padding.left - padding.right) / candles.length - 2));
  const stepX = (totalWidth - padding.left - padding.right) / (candles.length > 1 ? candles.length : 1);

  // Helper for price to Y coordinate
  const getY = (price: number) => {
    const norm = (price - minPrice) / priceRange;
    return padding.top + candlePlotAreaHeight * (1 - norm);
  };

  // Helper for volume to Y coordinate
  const getVolumeY = (vol: number) => {
    const vwapTop = chartHeight - padding.bottom - volumeHeight;
    const norm = vol / maxVolume;
    return vwapTop + volumeHeight * (1 - norm);
  };

  // Build SVG path for EMA9, EMA21, VWAP
  const ema9Path = useMemo(() => {
    if (!showEMA || candles.length < 2) return '';
    return candles.reduce((acc, c, i) => {
      if (!c.ema9) return acc;
      const x = padding.left + i * stepX + candleWidth / 2;
      const y = getY(c.ema9);
      return i === 0 || acc === '' ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [candles, showEMA, minPrice, priceRange]);

  const ema21Path = useMemo(() => {
    if (!showEMA || candles.length < 2) return '';
    return candles.reduce((acc, c, i) => {
      if (!c.ema21) return acc;
      const x = padding.left + i * stepX + candleWidth / 2;
      const y = getY(c.ema21);
      return i === 0 || acc === '' ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [candles, showEMA, minPrice, priceRange]);

  const vwapPath = useMemo(() => {
    if (!showVWAP || candles.length < 2) return '';
    return candles.reduce((acc, c, i) => {
      if (!c.vwap) return acc;
      const x = padding.left + i * stepX + candleWidth / 2;
      const y = getY(c.vwap);
      return i === 0 || acc === '' ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [candles, showVWAP, minPrice, priceRange]);

  // Active hover candle
  const hoveredCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[candles.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Top Header: Symbol, Live Price, Badges, Timeframes & Indicators */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        
        {/* Left: Scrip Info */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">{stock.symbol}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {stock.exchange}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">{stock.name}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-white tracking-tight">
                {formatINR(stock.ltp)}
              </span>
              <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                VWAP: {formatINR(stock.vwap)}
              </span>
            </div>
          </div>

          {/* ML Signal Badge */}
          <div className={`hidden lg:flex flex-col items-start px-2 py-1 rounded-lg border text-xs font-mono ${
            stock.mlSignal.includes('BUY') 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : stock.mlSignal.includes('SELL') 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <span className="text-[9px] uppercase tracking-wider font-sans font-medium text-slate-400">ML Model Bias</span>
            <div className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{stock.mlSignal.replace('_', ' ')}</span>
              <span className="text-[10px] text-slate-300">({stock.mlConfidence}%)</span>
            </div>
          </div>
        </div>

        {/* Right: Controls (Timeframe & Toggles) */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/80 text-xs">
            {['1m', '5m', '15m', '1h'].map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2 py-1 rounded-md font-mono text-[11px] transition-all ${
                  selectedTimeframe === tf 
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator toggles */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-1 rounded border transition-all ${
                showEMA ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              EMA 9/21
            </button>
            <button
              onClick={() => setShowSupertrend(!showSupertrend)}
              className={`px-2 py-1 rounded border transition-all ${
                showSupertrend ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              Supertrend
            </button>
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded border transition-all ${
                showVWAP ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              VWAP
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 rounded border transition-all ${
                showVolume ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              Vol
            </button>
          </div>

        </div>

      </div>

      {/* Floating Indicator Legend & Hover Bar */}
      <div className="bg-slate-950/60 px-3 py-1.5 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>O: <strong className="text-slate-200">{hoveredCandle?.open.toFixed(2)}</strong></span>
          <span>H: <strong className="text-slate-200">{hoveredCandle?.high.toFixed(2)}</strong></span>
          <span>L: <strong className="text-slate-200">{hoveredCandle?.low.toFixed(2)}</strong></span>
          <span>C: <strong className="text-slate-200">{hoveredCandle?.close.toFixed(2)}</strong></span>
          <span>RSI: <strong className={hoveredCandle?.rsi && hoveredCandle.rsi > 70 ? 'text-amber-400' : hoveredCandle?.rsi && hoveredCandle.rsi < 30 ? 'text-sky-400' : 'text-slate-300'}>{hoveredCandle?.rsi || stock.rsi}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {showEMA && (
            <>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-0.5 bg-sky-400 inline-block" /> EMA 9: {hoveredCandle?.ema9 || stock.ema9}
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" /> EMA 21: {hoveredCandle?.ema21 || stock.ema21}
              </span>
            </>
          )}
          {showVWAP && (
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> VWAP: {hoveredCandle?.vwap || stock.vwap}
            </span>
          )}
          {showSupertrend && (
            <span className={`flex items-center gap-1 ${stock.supertrendSignal === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stock.supertrendSignal === 'BUY' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              ST: {stock.supertrendValue} ({stock.supertrendSignal})
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div 
        ref={containerRef}
        className="relative w-full h-[340px] bg-slate-950 select-none overflow-hidden cursor-crosshair"
      >
        <svg 
          viewBox={`0 0 ${totalWidth} ${chartHeight}`} 
          className="w-full h-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * totalWidth;
            const idx = Math.floor((relX - padding.left) / stepX);
            if (idx >= 0 && idx < candles.length) {
              setHoverIndex(idx);
            }
          }}
        >
          <defs>
            {/* Grid line pattern */}
            <linearGradient id="volUpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="volDownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Horizontal Price Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const price = minPrice + priceRange * (1 - pct);
            const y = padding.top + candlePlotAreaHeight * pct;
            return (
              <g key={pct}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={totalWidth - padding.right} 
                  y2={y} 
                  stroke="#1e293b" 
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text 
                  x={totalWidth - padding.right + 6} 
                  y={y + 3} 
                  fill="#64748b" 
                  fontSize="9" 
                  fontFamily="monospace"
                >
                  {price.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume bars */}
          {showVolume && candles.map((c, i) => {
            const x = padding.left + i * stepX + (candleWidth / 4);
            const w = Math.max(2, candleWidth / 2);
            const y = getVolumeY(c.volume);
            const height = chartHeight - padding.bottom - y;
            const isUp = c.close >= c.open;

            return (
              <rect
                key={`vol-${i}`}
                x={x}
                y={y}
                width={w}
                height={Math.max(1, height)}
                fill={isUp ? 'url(#volUpGrad)' : 'url(#volDownGrad)'}
              />
            );
          })}

          {/* Indicator Lines: EMA9, EMA21, VWAP */}
          {showVWAP && (
            <path d={vwapPath} fill="none" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="2 2" />
          )}
          {showEMA && (
            <>
              <path d={ema9Path} fill="none" stroke="#38bdf8" strokeWidth="1.4" />
              <path d={ema21Path} fill="none" stroke="#fbbf24" strokeWidth="1.4" />
            </>
          )}

          {/* Candlesticks (Wick + Body) */}
          {candles.map((c, i) => {
            const x = padding.left + i * stepX;
            const cx = x + candleWidth / 2;
            const isUp = c.close >= c.open;
            const color = isUp ? '#10b981' : '#f43f5e';

            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line 
                  x1={cx} 
                  y1={highY} 
                  x2={cx} 
                  y2={lowY} 
                  stroke={color} 
                  strokeWidth="1.2" 
                />
                
                {/* Body */}
                <rect 
                  x={x} 
                  y={bodyTop} 
                  width={candleWidth} 
                  height={bodyHeight} 
                  fill={isUp ? '#10b981' : '#f43f5e'} 
                  rx="0.5"
                />

                {/* Supertrend dots */}
                {showSupertrend && c.supertrend && (
                  <circle
                    cx={cx}
                    cy={getY(c.supertrend)}
                    r="1.5"
                    fill={c.supertrendDir === 'BUY' ? '#10b981' : '#f43f5e'}
                  />
                )}
              </g>
            );
          })}

          {/* Active Position Overlay (Entry, Stop Loss, Target lines) */}
          {activePosition && (
            <g>
              {/* Entry line */}
              <line 
                x1={padding.left} 
                y1={getY(activePosition.avgPrice)} 
                x2={totalWidth - padding.right} 
                y2={getY(activePosition.avgPrice)} 
                stroke="#38bdf8" 
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <rect 
                x={totalWidth - padding.right + 2} 
                y={getY(activePosition.avgPrice) - 7} 
                width="60" 
                height="14" 
                fill="#0284c7" 
                rx="2"
              />
              <text 
                x={totalWidth - padding.right + 5} 
                y={getY(activePosition.avgPrice) + 3} 
                fill="#ffffff" 
                fontSize="8" 
                fontWeight="bold"
                fontFamily="monospace"
              >
                ENTRY {activePosition.avgPrice.toFixed(1)}
              </text>

              {/* Stop Loss line */}
              <line 
                x1={padding.left} 
                y1={getY(activePosition.stopLoss)} 
                x2={totalWidth - padding.right} 
                y2={getY(activePosition.stopLoss)} 
                stroke="#f43f5e" 
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <rect 
                x={totalWidth - padding.right + 2} 
                y={getY(activePosition.stopLoss) - 7} 
                width="60" 
                height="14" 
                fill="#e11d48" 
                rx="2"
              />
              <text 
                x={totalWidth - padding.right + 5} 
                y={getY(activePosition.stopLoss) + 3} 
                fill="#ffffff" 
                fontSize="8" 
                fontWeight="bold"
                fontFamily="monospace"
              >
                SL {activePosition.stopLoss.toFixed(1)}
              </text>

              {/* Target line */}
              <line 
                x1={padding.left} 
                y1={getY(activePosition.targetPrice)} 
                x2={totalWidth - padding.right} 
                y2={getY(activePosition.targetPrice)} 
                stroke="#10b981" 
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <rect 
                x={totalWidth - padding.right + 2} 
                y={getY(activePosition.targetPrice) - 7} 
                width="60" 
                height="14" 
                fill="#059669" 
                rx="2"
              />
              <text 
                x={totalWidth - padding.right + 5} 
                y={getY(activePosition.targetPrice) + 3} 
                fill="#ffffff" 
                fontSize="8" 
                fontWeight="bold"
                fontFamily="monospace"
              >
                TGT {activePosition.targetPrice.toFixed(1)}
              </text>
            </g>
          )}

          {/* Crosshair Cursor on Hover */}
          {hoverIndex !== null && candles[hoverIndex] && (
            <g>
              <line 
                x1={padding.left + hoverIndex * stepX + candleWidth / 2} 
                y1={padding.top} 
                x2={padding.left + hoverIndex * stepX + candleWidth / 2} 
                y2={chartHeight - padding.bottom} 
                stroke="#94a3b8" 
                strokeWidth="0.8" 
                strokeDasharray="2 2" 
              />
              <line 
                x1={padding.left} 
                y1={getY(candles[hoverIndex].close)} 
                x2={totalWidth - padding.right} 
                y2={getY(candles[hoverIndex].close)} 
                stroke="#94a3b8" 
                strokeWidth="0.8" 
                strokeDasharray="2 2" 
              />
              {/* Date stamp at bottom */}
              <rect 
                x={padding.left + hoverIndex * stepX - 25} 
                y={chartHeight - padding.bottom + 2} 
                width="50" 
                height="14" 
                fill="#1e293b" 
                rx="2" 
              />
              <text 
                x={padding.left + hoverIndex * stepX} 
                y={chartHeight - padding.bottom + 12} 
                fill="#cbd5e1" 
                fontSize="8" 
                textAnchor="middle" 
                fontFamily="monospace"
              >
                {candles[hoverIndex].time}
              </text>
            </g>
          )}
        </svg>
      </div>

    </div>
  );
};
