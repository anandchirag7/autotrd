import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Sliders,
  Cpu
} from 'lucide-react';
import { StockQuote, AIMarketRegime, BotConfig, ModelSettings, AgentPrompts } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface AIStrategyAdvisorProps {
  stocks: StockQuote[];
  config: BotConfig;
  modelSettings?: ModelSettings;
  agentPrompts?: AgentPrompts;
  onApplyAdjustments: (adjustments: any) => void;
}

export const AIStrategyAdvisor: React.FC<AIStrategyAdvisorProps> = ({
  stocks,
  config,
  modelSettings,
  agentPrompts,
  onApplyAdjustments,
}) => {
  const [marketRegime, setMarketRegime] = useState<AIMarketRegime | null>(null);
  const [isLoadingRegime, setIsLoadingRegime] = useState<boolean>(false);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [stockAnalysis, setStockAnalysis] = useState<any | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Fetch AI Market Regime analysis
  const fetchMarketRegime = async () => {
    setIsLoadingRegime(true);
    try {
      const nifty = stocks.find(s => s.symbol === 'NIFTY 50');
      const banknifty = stocks.find(s => s.symbol === 'BANKNIFTY');

      const marketSnapshot = {
        niftyLTP: nifty?.ltp || 24850,
        niftyChange: nifty?.changePercent || 0.45,
        bankniftyLTP: banknifty?.ltp || 52400,
        bankniftyChange: banknifty?.changePercent || 0.62,
        breadthAdvancing: stocks.filter(s => s.change >= 0).length,
        breadthDeclining: stocks.filter(s => s.change < 0).length,
        avgRSI: Math.round(stocks.reduce((a, s) => a + s.rsi, 0) / stocks.length),
      };

      const response = await fetch('/api/ai/market-regime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketData: marketSnapshot,
          activeStrategy: config.selectedStrategy,
          currentPositions: [],
          customPrompt: agentPrompts?.marketRegimePrompt,
          modelConfig: modelSettings,
        }),
      });

      const data = await response.json();
      setMarketRegime(data);
    } catch (err) {
      console.error('Failed to load market regime:', err);
    } finally {
      setIsLoadingRegime(false);
    }
  };

  // Fetch individual stock analysis
  const analyzeSelectedStock = async (symbol: string) => {
    setIsLoadingStock(true);
    try {
      const stock = stocks.find(s => s.symbol === symbol) || stocks[0];
      const response = await fetch('/api/ai/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          exchange: stock.exchange,
          ltp: stock.ltp,
          indicators: {
            rsi: stock.rsi,
            supertrendSignal: stock.supertrendSignal,
            supertrendValue: stock.supertrendValue,
            ema9: stock.ema9,
            ema21: stock.ema21,
            vwap: stock.vwap,
            macdHist: stock.macdHist,
          },
          timeframe: '5m',
          customPrompt: agentPrompts?.stockAnalysisPrompt,
          modelConfig: modelSettings,
        }),
      });

      const data = await response.json();
      setStockAnalysis(data);
    } catch (err) {
      console.error('Failed to analyze stock:', err);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchMarketRegime();
  }, []);

  useEffect(() => {
    if (selectedStockSymbol) {
      analyzeSelectedStock(selectedStockSymbol);
    }
  }, [selectedStockSymbol]);

  const handleApply = () => {
    if (!marketRegime?.recommendations) return;
    onApplyAdjustments({
      riskPerTradePercent: marketRegime.recommendations.riskPerTradePercent,
      targetRiskRewardRatio: marketRegime.recommendations.targetRiskRewardRatio,
      trailingStepPercent: marketRegime.recommendations.trailingSlMultiplier ? marketRegime.recommendations.trailingSlMultiplier * 0.3 : 0.5,
    });
    setAppliedNotice('Dynamic strategy settings successfully adopted into the live agent runtime!');
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Market Regime Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Dynamic AI Market Regime & Strategy Advisor</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {modelSettings?.isLocal ? `Local: ${modelSettings.modelName}` : `Engine: ${modelSettings?.modelName || 'gemini-3.8-flash'}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Machine learning model constantly evaluates NSE/BSE market structure and dynamically tunes the autonomous bot.
              </p>
            </div>
          </div>

          <button
            onClick={fetchMarketRegime}
            disabled={isLoadingRegime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRegime ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isLoadingRegime ? 'Analyzing Regimes...' : 'Re-Evaluate Live Regimes'}</span>
          </button>
        </div>

        {/* Market Regime Card Output */}
        {marketRegime ? (
          <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Regime Status & Overview */}
            <div className="lg:col-span-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase text-slate-400">Current Market Regime</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    ML Confidence: {marketRegime.confidence}%
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{marketRegime.regime}</span>
                </h3>
                
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                  {marketRegime.analysis}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
                <span className="text-[11px] font-mono">
                  Active Instruments: <strong className="text-slate-200">{marketRegime.recommendations?.activeInstruments?.join(', ') || 'NIFTY, BANKNIFTY, RELIANCE'}</strong>
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {marketRegime.recommendations?.squareOffWarning || 'MIS auto square-off maintained by 15:15 IST'}
                </span>
              </div>
            </div>

            {/* Dynamic Parameter Recommendations */}
            <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-300 block mb-2 font-semibold">
                  Dynamic Parameter Adjustments
                </span>

                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Rec. Strategy:</span>
                    <span className="text-white font-bold">{marketRegime.recommendations?.recommendedStrategy?.slice(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk / Trade:</span>
                    <span className="text-emerald-400 font-bold">{marketRegime.recommendations?.riskPerTradePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target R:R Ratio:</span>
                    <span className="text-sky-400 font-bold">1 : {marketRegime.recommendations?.targetRiskRewardRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trailing SL Mult:</span>
                    <span className="text-amber-400 font-bold">{marketRegime.recommendations?.trailingSlMultiplier}x ATR</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleApply}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adopt Dynamic Adjustments</span>
                </button>
                {appliedNotice && (
                  <p className="text-[10px] text-emerald-400 text-center mt-1 font-mono animate-in fade-in">
                    {appliedNotice}
                  </p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            Evaluating Indian market regime...
          </div>
        )}
      </div>

      {/* Deep Scrip AI Intelligence Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Scrip-Specific Quantitative Model Inspector</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Select Instrument:</span>
            <select
              value={selectedStockSymbol}
              onChange={(e) => setSelectedStockSymbol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} ({s.exchange}) - ₹{s.ltp.toFixed(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Analysis Card */}
        {isLoadingStock ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            <Sparkles className="w-5 h-5 mx-auto mb-2 text-indigo-400 animate-spin" />
            Running ML feature extraction for {selectedStockSymbol}...
          </div>
        ) : stockAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            
            {/* Verdict */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1">Model Verdict</span>
              <div className={`text-base font-bold uppercase ${
                stockAnalysis.action === 'BUY' ? 'text-emerald-400' : stockAnalysis.action === 'SELL' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {stockAnalysis.action} ({stockAnalysis.mlConfidence}% Conviction)
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Risk-to-Reward: {stockAnalysis.riskRewardRatio}
              </span>
            </div>

            {/* Entry / Levels */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1">Suggested Entry Price</span>
              <div className="text-base font-bold text-white">
                {formatINR(stockAnalysis.suggestedEntry || 0)}
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                Target: {formatINR(stockAnalysis.suggestedTarget || 0)}
              </span>
            </div>

            {/* Stop Loss */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1">Stop-Loss Protection</span>
              <div className="text-base font-bold text-rose-400">
                {formatINR(stockAnalysis.suggestedStopLoss || 0)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Resistance: ₹{stockAnalysis.keyLevels?.resistance || 0}
              </span>
            </div>

            {/* Support / VWAP */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1">Institutional VWAP Profile</span>
              <div className="text-base font-bold text-sky-400">
                {stockAnalysis.keyLevels?.vwapDistance || '+0.3%'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Support: ₹{stockAnalysis.keyLevels?.support || 0}
              </span>
            </div>

            {/* Full Rationale */}
            <div className="md:col-span-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
                Autonomous Trade Rationale
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {stockAnalysis.rationale}
              </p>
            </div>

          </div>
        ) : null}
      </div>

    </div>
  );
};
