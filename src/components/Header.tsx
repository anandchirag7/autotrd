import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Power, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Wifi, 
  Bell, 
  TrendingUp, 
  Clock,
  Layers,
  ChevronDown,
  BarChart3,
  Settings
} from 'lucide-react';
import { BotConfig, BrokerAccount, TradeAlert } from '../types';
import { soundEngine } from '../utils/soundEffects';

export type ActiveTabType = 'terminal' | 'analytics' | 'backtest' | 'ai-advisor' | 'settings';

interface HeaderProps {
  config: BotConfig;
  brokerAccount: BrokerAccount;
  alerts: TradeAlert[];
  unreadAlertsCount: number;
  onUpdateConfig: (updates: Partial<BotConfig>) => void;
  onOpenSettings: () => void;
  onOpenBrokerModal: () => void;
  onOpenAlertsDrawer: () => void;
  onTriggerKillSwitch: () => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  brokerAccount,
  unreadAlertsCount,
  onUpdateConfig,
  onOpenSettings,
  onOpenBrokerModal,
  onOpenAlertsDrawer,
  onTriggerKillSwitch,
  activeTab,
  setActiveTab,
}) => {
  const [currentTimeIST, setCurrentTimeIST] = useState<string>('');
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);

  // Maintain real-time Indian Standard Time (IST) clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTimeIST(istString);

      // Indian market hours: 09:15 to 15:30 IST on Mon-Fri
      const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const day = istDate.getDay(); // 0 is Sunday, 6 is Saturday

      const currentMinutes = hours * 60 + minutes;
      const marketOpenMinutes = 9 * 60 + 15; // 09:15
      const marketCloseMinutes = 15 * 60 + 30; // 15:30

      const isWeekday = day >= 1 && day <= 5;
      setIsMarketOpen(isWeekday && currentMinutes >= marketOpenMinutes && currentMinutes <= marketCloseMinutes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextState = !config.soundAlerts;
    soundEngine.setEnabled(nextState);
    onUpdateConfig({ soundAlerts: nextState });
  };

  const toggleBotRunning = () => {
    if (config.killSwitchEngaged) {
      alert("Emergency Kill Switch is currently active. Reset the Kill Switch before reactivating the bot.");
      return;
    }
    onUpdateConfig({ isActive: !config.isActive, isPaused: false });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Brand Identity & Market Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">AUTONOMOUS BOT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium uppercase bg-slate-800 text-emerald-400 border border-emerald-500/30">
                  NSE • BSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>IST {currentTimeIST || '09:15:00'}</span>
                <span className="text-slate-600">•</span>
                <span className={`inline-flex items-center gap-1 font-medium ${isMarketOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isMarketOpen ? 'MARKET LIVE' : 'SESSION SIMULATOR'}
                </span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 ml-4 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              id="tab-terminal-btn"
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'terminal' 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Terminal
            </button>
            <button
              id="tab-analytics-btn"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
            <button
              id="tab-backtest-btn"
              onClick={() => setActiveTab('backtest')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'backtest' 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backtesting
            </button>
            <button
              id="tab-ai-advisor-btn"
              onClick={() => setActiveTab('ai-advisor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'ai-advisor' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-indigo-400 hover:text-indigo-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              AI Strategy
            </button>
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'settings' 
                  ? 'bg-slate-700 text-white shadow border border-slate-600' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings & APIs
            </button>
          </div>
        </div>

        {/* Right: Controls, Broker Status, Kill Switch & Settings */}
        <div className="flex items-center gap-2">
          
          {/* Paper / Live Mode Pill */}
          <button
            id="mode-switch-btn"
            onClick={onOpenBrokerModal}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
              config.tradingMode === 'paper'
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title="Click to configure broker connection and trading mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase">{config.tradingMode === 'paper' ? 'PAPER SIM' : 'LIVE BROKER'}</span>
            <span className="text-[10px] text-slate-400 font-sans">({brokerAccount.brokerId.toUpperCase()})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Broker Latency indicator */}
          <div 
            onClick={onOpenBrokerModal}
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-800/70 border border-slate-700/60 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
            title="Broker API ping latency"
          >
            <Wifi className={`w-3.5 h-3.5 ${brokerAccount.connected ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="font-mono text-[11px]">{brokerAccount.pingLatencyMs}ms</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              config.soundAlerts
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                : 'bg-slate-800/50 border-slate-800 text-slate-500'
            }`}
            title={config.soundAlerts ? 'Sound Alerts: Enabled' : 'Sound Alerts: Muted'}
          >
            {config.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Real-time Alerts Bell */}
          <button
            id="alerts-bell-btn"
            onClick={onOpenAlertsDrawer}
            className="relative p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Open Trade Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-pulse">
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Strategy Settings Button */}
          <button
            id="settings-modal-btn"
            onClick={() => {
              setActiveTab('settings');
              onOpenSettings();
            }}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center gap-1 text-xs"
            title="Configure Autonomous Risk, APIs & Strategy Rules"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden lg:inline text-xs font-medium">Settings & APIs</span>
          </button>

          {/* Autonomous Start / Pause Agent Toggle */}
          <button
            id="autonomous-toggle-btn"
            onClick={toggleBotRunning}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm ${
              config.isActive && !config.isPaused && !config.killSwitchEngaged
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{config.isActive && !config.killSwitchEngaged ? 'AGENT ACTIVE' : 'AGENT PAUSED'}</span>
          </button>

          {/* Emergency Kill Switch Button */}
          <button
            id="kill-switch-btn"
            onClick={onTriggerKillSwitch}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              config.killSwitchEngaged
                ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Emergency Kill Switch: Cancels all pending orders and squares off active positions"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KILL SWITCH</span>
          </button>

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden items-center justify-around mt-2 pt-2 border-t border-slate-800 text-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`py-1 px-2 rounded font-medium whitespace-nowrap ${activeTab === 'terminal' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Terminal
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-1 px-2 rounded font-medium whitespace-nowrap ${activeTab === 'analytics' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`py-1 px-2 rounded font-medium whitespace-nowrap ${activeTab === 'backtest' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Backtest
        </button>
        <button
          onClick={() => setActiveTab('ai-advisor')}
          className={`py-1 px-2 rounded font-medium whitespace-nowrap flex items-center gap-1 ${activeTab === 'ai-advisor' ? 'text-indigo-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          AI Advisor
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-1 px-2 rounded font-medium whitespace-nowrap flex items-center gap-1 ${activeTab === 'settings' ? 'text-white font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
