import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Shield, 
  Target, 
  Cpu, 
  Clock, 
  Save, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { BotConfig, StrategyType, Exchange, OrderType } from '../types';
import { formatINR } from '../utils/technicalIndicators';

interface StrategySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onSaveConfig: (updated: Partial<BotConfig>) => void;
}

export const StrategySettingsModal: React.FC<StrategySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<BotConfig>({ ...config });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  const handleResetDefaults = () => {
    setFormData({
      ...config,
      capitalAllocated: 250000,
      riskPerTradePercent: 1.5,
      targetRiskRewardRatio: 2.2,
      maxOpenPositions: 4,
      dailyMaxLossLimit: 5000,
      trailingSlEnabled: true,
      trailingStepPercent: 0.5,
      intradayAutoSquareOffTime: '15:15',
      mlConfidenceThreshold: 65,
      autoStrategyAdjustment: true,
      selectedStrategy: 'ml_adaptive',
      productType: 'MIS',
      exchanges: ['NSE', 'BSE'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-base text-white">Autonomous Agent Risk & Strategy Rules</h2>
              <p className="text-xs text-slate-400">Pre-defined execution limits, technical indicators & safety guards</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200 custom-scrollbar">
          
          {/* Section 1: Active Strategy Preset */}
          <div>
            <label className="font-bold text-xs uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Core Trading Strategy Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { 
                  id: 'ml_adaptive', 
                  name: 'ML Adaptive Multi-Factor (Recommended)', 
                  desc: 'Machine learning ensemble with Supertrend, EMA 9/21, VWAP and dynamic volatility regime detection.' 
                },
                { 
                  id: 'supertrend_breakout', 
                  name: 'SuperTrend (10, 3) Breakout', 
                  desc: 'High-conviction trend breakouts with ATR volatility trailing stop-loss.' 
                },
                { 
                  id: 'ema_ribbon_scalp', 
                  name: 'EMA Ribbon Scalper (9 / 21)', 
                  desc: 'Fast intraday momentum scalping on moving average golden/death crosses with VWAP confirmation.' 
                },
                { 
                  id: 'mean_reversion_rsi', 
                  name: 'Mean Reversion RSI (14) Pullback', 
                  desc: 'Capitalizes on overbought (>70) and oversold (<30) extremes with tight dynamic targets.' 
                },
              ].map((strat) => (
                <div
                  key={strat.id}
                  onClick={() => setFormData({ ...formData, selectedStrategy: strat.id as StrategyType })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.selectedStrategy === strat.id
                      ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-white mb-1 flex items-center justify-between">
                    <span>{strat.name}</span>
                    {formData.selectedStrategy === strat.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{strat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Capital Allocation & Risk per Trade */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Allocated Capital (₹ INR)
              </label>
              <input
                type="number"
                step="10000"
                value={formData.capitalAllocated}
                onChange={(e) => setFormData({ ...formData, capitalAllocated: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total margin budget for autonomous trades: {formatINR(formData.capitalAllocated)}
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Risk Per Trade ({formData.riskPerTradePercent}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={formData.riskPerTradePercent}
                onChange={(e) => setFormData({ ...formData, riskPerTradePercent: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0.5% (Conservative)</span>
                <span className="font-bold text-emerald-400">{formData.riskPerTradePercent}% (₹{((formData.capitalAllocated * formData.riskPerTradePercent) / 100).toFixed(0)})</span>
                <span>4.0% (Aggressive)</span>
              </div>
            </div>

          </div>

          {/* Section 3: Risk-Reward & Position Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                <span>Target Risk-Reward Ratio (1 : {formData.targetRiskRewardRatio})</span>
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              </label>
              <input
                type="range"
                min="1.2"
                max="3.5"
                step="0.1"
                value={formData.targetRiskRewardRatio}
                onChange={(e) => setFormData({ ...formData, targetRiskRewardRatio: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                For every ₹1 risked on Stop-Loss, agent targets ₹{formData.targetRiskRewardRatio} in profit
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Max Concurrent Positions (Open Trades)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.maxOpenPositions}
                onChange={(e) => setFormData({ ...formData, maxOpenPositions: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Prevents over-exposure by limiting simultaneous open orders
              </span>
            </div>

          </div>

          {/* Section 4: Safety Circuit Breaker & Trailing SL */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1 text-rose-400">
                <Shield className="w-3.5 h-3.5" />
                Daily Circuit Breaker Max Loss (₹)
              </label>
              <input
                type="number"
                step="1000"
                value={formData.dailyMaxLossLimit}
                onChange={(e) => setFormData({ ...formData, dailyMaxLossLimit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Bot immediately halts and pauses all trading if today's loss touches {formatINR(formData.dailyMaxLossLimit)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">
                  Dynamic Trailing Stop-Loss
                </label>
                <input
                  type="checkbox"
                  checked={formData.trailingSlEnabled}
                  onChange={(e) => setFormData({ ...formData, trailingSlEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Locks in profits as price advances in trade direction. Step: {formData.trailingStepPercent}%
              </p>
              {formData.trailingSlEnabled && (
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={formData.trailingStepPercent}
                  onChange={(e) => setFormData({ ...formData, trailingStepPercent: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer mt-2"
                />
              )}
            </div>

          </div>

          {/* Section 5: Indian Market Specifics (MIS Auto Square-Off & Product Type) */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Intraday Auto Square-Off Time
              </label>
              <input
                type="text"
                value={formData.intradayAutoSquareOffTime}
                onChange={(e) => setFormData({ ...formData, intradayAutoSquareOffTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="15:15"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Indian brokers square-off MIS at 15:20 IST. Bot will close positions at 15:15 IST.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Order Product Type
              </label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value as OrderType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="MIS">MIS (Intraday with Margin Leverage)</option>
                <option value="CNC">CNC (Cash & Carry / Delivery)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                Min ML Conviction Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="55"
                  max="85"
                  step="5"
                  value={formData.mlConfidenceThreshold}
                  onChange={(e) => setFormData({ ...formData, mlConfidenceThreshold: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="font-mono font-bold text-indigo-400 text-xs">{formData.mlConfidenceThreshold}%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Requires at least {formData.mlConfidenceThreshold}% AI model confidence before placing order
              </span>
            </div>

          </div>

          {/* Section 6: Dynamic Strategy Adjustment Toggle */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <div className="pr-4">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Dynamic AI Strategy Auto-Adjustment
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Allows the autonomous agent to continuously evaluate market volatility regimes (Trending, Rangebound, RBI Rate Policy, Earnings) and dynamically adapt Stop-Loss multipliers and position sizing.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoStrategyAdjustment}
              onChange={(e) => setFormData({ ...formData, autoStrategyAdjustment: e.target.checked })}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save & Apply Rules
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
