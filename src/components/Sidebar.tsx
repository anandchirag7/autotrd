import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  History, 
  TrendingUp, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Wifi, 
  Cpu, 
  Server,
  Power,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { BotConfig, ModelSettings, BrokerAccount } from '../types';

export type ActiveTabType = 'terminal' | 'analytics' | 'backtest' | 'ai-advisor' | 'settings';

interface SidebarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  config: BotConfig;
  modelSettings: ModelSettings;
  brokerAccount: BrokerAccount;
  onToggleBot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  config,
  modelSettings,
  brokerAccount,
  onToggleBot,
}) => {
  const navItems = [
    {
      id: 'terminal' as ActiveTabType,
      label: 'Live Terminal',
      sublabel: 'Execution & Charts',
      icon: LayoutDashboard,
      badge: config.isActive ? 'LIVE' : undefined,
    },
    {
      id: 'analytics' as ActiveTabType,
      label: 'Analytics Dashboard',
      sublabel: 'Pure Quant Analytics',
      icon: BarChart3,
      badge: 'PRO',
    },
    {
      id: 'backtest' as ActiveTabType,
      label: 'Backtesting Engine',
      sublabel: 'Historical Simulations',
      icon: History,
    },
    {
      id: 'ai-advisor' as ActiveTabType,
      label: 'AI Strategy Advisor',
      sublabel: 'Regime & Scrip AI',
      icon: TrendingUp,
    },
    {
      id: 'settings' as ActiveTabType,
      label: 'Settings & API Hub',
      sublabel: 'Broker & Model Setup',
      icon: Settings,
      highlight: true,
    },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between z-30 shrink-0 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section: Navigation Links */}
      <div>
        {/* Collapse toggle header inside sidebar */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wider font-mono uppercase">
                QUANT AGENT
              </span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="truncate">
                      <div className="text-xs font-semibold leading-tight truncate">
                        {item.label}
                      </div>
                      <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {item.sublabel}
                      </div>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ml-1.5 uppercase ${
                        isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Live System Status Cards */}
      <div className="p-2 border-t border-slate-800/80 space-y-2">
        
        {/* Agent Run / Pause Button */}
        <button
          onClick={onToggleBot}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold transition-all ${
            config.isActive && !config.isPaused && !config.killSwitchEngaged
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
          title={collapsed ? (config.isActive ? 'Agent Running' : 'Agent Paused') : undefined}
        >
          <Power className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && (
            <span>{config.isActive && !config.killSwitchEngaged ? 'Agent Active' : 'Agent Paused'}</span>
          )}
        </button>

        {/* Status Indicators in Expanded Mode */}
        {!collapsed && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 space-y-2 text-[11px]">
            {/* Broker Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-500" />
                <span>Broker Gateway</span>
              </span>
              <span className="font-mono text-white font-semibold flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${brokerAccount.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {config.broker.toUpperCase()}
              </span>
            </div>

            {/* Model Provider */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-slate-500" />
                <span>AI Engine</span>
              </span>
              <span className="font-mono text-emerald-400 truncate max-w-[100px]" title={modelSettings.modelName}>
                {modelSettings.isLocal ? 'Local Ollama' : 'Gemini 3.8'}
              </span>
            </div>

            {/* Mode */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-slate-500" />
                <span>Execution Mode</span>
              </span>
              <span className={`font-mono uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                config.tradingMode === 'paper' 
                  ? 'bg-sky-500/15 text-sky-400' 
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {config.tradingMode}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
