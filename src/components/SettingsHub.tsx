import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Server, 
  Sliders, 
  FileCode, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Save, 
  Wifi, 
  Zap,
  Lock,
  Terminal,
  Info,
  Radio
} from 'lucide-react';
import { 
  BotConfig, 
  ModelSettings, 
  AgentPrompts, 
  BrokerApiCredentials, 
  BrokerAccount 
} from '../types';

interface SettingsHubProps {
  config: BotConfig;
  modelSettings: ModelSettings;
  agentPrompts: AgentPrompts;
  brokerCredentials: BrokerApiCredentials;
  brokerAccount: BrokerAccount;
  onUpdateConfig: (updates: Partial<BotConfig>) => void;
  onUpdateModelSettings: (updates: Partial<ModelSettings>) => void;
  onUpdateAgentPrompts: (updates: Partial<AgentPrompts>) => void;
  onUpdateBrokerCredentials: (updates: Partial<BrokerApiCredentials>) => void;
  onResetPrompts: () => void;
  onSaveAll: () => void;
}

export const SettingsHub: React.FC<SettingsHubProps> = ({
  config,
  modelSettings,
  agentPrompts,
  brokerCredentials,
  brokerAccount,
  onUpdateConfig,
  onUpdateModelSettings,
  onUpdateAgentPrompts,
  onUpdateBrokerCredentials,
  onResetPrompts,
  onSaveAll,
}) => {
  const [activeTab, setActiveTab] = useState<'broker' | 'model' | 'prompts' | 'risk'>('broker');
  
  // UI visibility toggles for secret keys
  const [showBrokerSecret, setShowBrokerSecret] = useState(false);
  const [showModelKey, setShowModelKey] = useState(false);

  // Testing states
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [modelTestResult, setModelTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [isTestingBroker, setIsTestingBroker] = useState(false);
  const [brokerTestResult, setBrokerTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [saveToast, setSaveToast] = useState(false);

  // Test Model Connection (Gemini or Local Ollama/LM Studio)
  const handleTestModel = async () => {
    setIsTestingModel(true);
    setModelTestResult(null);

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: modelSettings.provider,
          modelName: modelSettings.modelName,
          apiKey: modelSettings.apiKey,
          baseUrl: modelSettings.baseUrl,
          isLocal: modelSettings.isLocal,
        }),
      });

      const data = await response.json();
      setModelTestResult({
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
      });

      onUpdateModelSettings({
        status: data.success ? 'connected' : 'error',
        lastPingMs: data.latencyMs,
      });
    } catch (err: any) {
      setModelTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Network error'}`,
      });
      onUpdateModelSettings({ status: 'error' });
    } finally {
      setIsTestingModel(false);
    }
  };

  // Test Broker API Connection
  const handleTestBroker = async () => {
    setIsTestingBroker(true);
    setBrokerTestResult(null);

    try {
      const response = await fetch('/api/broker/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: brokerCredentials.brokerId,
          clientId: brokerCredentials.clientId,
          apiKey: brokerCredentials.apiKey,
          totpToken: brokerCredentials.totpToken,
          sandboxMode: brokerCredentials.sandboxMode,
        }),
      });

      const data = await response.json();
      setBrokerTestResult({
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
      });
    } catch (err: any) {
      setBrokerTestResult({
        success: false,
        message: `Broker API handshake failed: ${err.message || 'Timeout'}`,
      });
    } finally {
      setIsTestingBroker(false);
    }
  };

  const handleSave = () => {
    onSaveAll();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              System Configuration
            </span>
            <span className="text-xs text-slate-400 font-mono">Real APIs • Models • Prompts • Safeguards</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">API Gateway & Agent Configuration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure real NSE/BSE broker integrations, customize Gemini or Local LLMs (Ollama / LM Studio), and edit agent system prompts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveToast && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Changes Applied
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save & Deploy Configuration</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('broker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'broker'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Real Broker APIs (NSE/BSE)</span>
        </button>

        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'model'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Model & Inference (Gemini / Local)</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'prompts'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Agent Prompt Engineering</span>
        </button>

        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'risk'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Risk & Order Routing Rules</span>
        </button>
      </div>

      {/* TAB 1: REAL BROKER APIS */}
      {activeTab === 'broker' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Indian Stock Broker API Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your official broker API keys for automated order placement, real-time WebSocket tick stream, and margin monitoring.
              </p>
            </div>

            {/* Broker Choice */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Selected Broker Gateway</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'zerodha', name: 'Zerodha Kite', tag: 'Kite Connect 3.0' },
                  { id: 'angelone', name: 'Angel One', tag: 'SmartAPI' },
                  { id: 'upstox', name: 'Upstox', tag: 'API v2' },
                  { id: 'dhan', name: 'Dhan HQ', tag: 'Direct Access' },
                  { id: 'groww', name: 'Groww', tag: 'Fast Trade' },
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onUpdateBrokerCredentials({ brokerId: b.id as any });
                      onUpdateConfig({ broker: b.id as any });
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      brokerCredentials.brokerId === b.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100">{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Client ID */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  User ID / Client Code (e.g. AB1234)
                </label>
                <input
                  type="text"
                  value={brokerCredentials.clientId}
                  onChange={e => onUpdateBrokerCredentials({ clientId: e.target.value })}
                  placeholder="e.g. ZR9876 or ANGEL_CLIENT_ID"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Broker API Key
                </label>
                <input
                  type="text"
                  value={brokerCredentials.apiKey}
                  onChange={e => onUpdateBrokerCredentials({ apiKey: e.target.value })}
                  placeholder="e.g. kite_api_key_xxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* API Secret */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Broker API Secret
                </label>
                <div className="relative">
                  <input
                    type={showBrokerSecret ? 'text' : 'password'}
                    value={brokerCredentials.apiSecret}
                    onChange={e => onUpdateBrokerCredentials({ apiSecret: e.target.value })}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBrokerSecret(!showBrokerSecret)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showBrokerSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* TOTP Secret or Auth Token */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  TOTP Secret Key / Daily Auth Token
                </label>
                <input
                  type="password"
                  value={brokerCredentials.totpToken}
                  onChange={e => onUpdateBrokerCredentials({ totpToken: e.target.value })}
                  placeholder="Base32 TOTP secret for automated login"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Redirect URL */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Redirect Callback URL (Register this in your broker app console)
                </label>
                <input
                  type="text"
                  value={brokerCredentials.redirectUrl}
                  onChange={e => onUpdateBrokerCredentials({ redirectUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>

            {/* Mode Switch: Sandbox vs Live */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !brokerCredentials.sandboxMode;
                    onUpdateBrokerCredentials({ sandboxMode: nextMode });
                    onUpdateConfig({ tradingMode: nextMode ? 'paper' : 'live' });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    brokerCredentials.sandboxMode ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      brokerCredentials.sandboxMode ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {brokerCredentials.sandboxMode ? 'Virtual Paper Trading Mode' : 'Live Real Capital Execution'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {brokerCredentials.sandboxMode 
                      ? 'Simulates orders with ₹5,00,000 virtual balance & real live market ticks' 
                      : 'WARNING: Real orders are placed via your actual broker trading account'}
                  </div>
                </div>
              </div>

              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestBroker}
                disabled={isTestingBroker}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Wifi className={`w-3.5 h-3.5 ${isTestingBroker ? 'animate-spin' : 'text-emerald-400'}`} />
                <span>{isTestingBroker ? 'Verifying Gateway...' : 'Test Broker Connection'}</span>
              </button>
            </div>

            {/* Test Feedback Result */}
            {brokerTestResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                brokerTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {brokerTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-semibold">{brokerTestResult.message}</div>
                  {brokerTestResult.latencyMs && (
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Roundtrip ping latency: {brokerTestResult.latencyMs}ms
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Broker Documentation & Security Notice */}
          <div className="space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                API Security Architecture
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broker credentials are processed exclusively through secure server-side execution proxies (<code className="text-emerald-400">/api/broker/*</code>). Client secrets and TOTP tokens are never exposed in browser payloads.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SEBI Circular Compliant order tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sub-25ms order routing handshake</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automated 15:15 IST MIS square-off</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                Broker Setup Guide
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <span className="font-semibold text-white block">1. Zerodha Kite Connect:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Create an app on <span className="text-emerald-400">developers.kite.trade</span>, add the Redirect URL shown on the left, and copy your API Key & Secret.
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-white block">2. Angel One SmartAPI:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enable TOTP on SmartAPI portal (<span className="text-sky-400">smartapi.angelbroking.com</span>) and generate your historical & trading API keys.
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-white block">3. Upstox API v2:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Register app in Upstox Developer Console (<span className="text-indigo-400">service.upstox.com</span>) for OAuth 2.0 access.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: AI MODEL & INFERENCE (GEMINI OR LOCAL OLLAMA / LM STUDIO) */}
      {activeTab === 'model' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                AI Inference Engine & Model Provider
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose between Google Gemini or connect to a completely local model running on your machine via Ollama, LM Studio, or LocalAI for zero latency and private inference.
              </p>
            </div>

            {/* Provider Selection Cards */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Model Provider Architecture</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Google Gemini */}
                <button
                  type="button"
                  onClick={() => onUpdateModelSettings({ 
                    provider: 'gemini', 
                    isLocal: false, 
                    modelName: 'gemini-3.8-flash' 
                  })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    modelSettings.provider === 'gemini'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">Google Gemini</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Cloud</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    High throughput, multimodal market analysis with gemini-3.8-flash & gemini-2.5-pro.
                  </p>
                </button>

                {/* Local Model via Ollama */}
                <button
                  type="button"
                  onClick={() => onUpdateModelSettings({ 
                    provider: 'local_ollama', 
                    isLocal: true, 
                    baseUrl: 'http://localhost:11434/v1',
                    modelName: 'llama3.2:latest' 
                  })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    modelSettings.provider === 'local_ollama'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">Local Model (Ollama)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">100% Local</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Run open-weights LLMs on your GPU (e.g. Llama 3.2, DeepSeek-R1, Qwen 2.5) with zero internet.
                  </p>
                </button>

                {/* OpenAI / Custom Compatible */}
                <button
                  type="button"
                  onClick={() => onUpdateModelSettings({ 
                    provider: 'openai_compatible', 
                    isLocal: false, 
                    baseUrl: 'http://localhost:1234/v1',
                    modelName: 'local-model' 
                  })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    modelSettings.provider === 'openai_compatible'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">LM Studio / Custom</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">Custom API</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Connect any OpenAI-compatible API endpoint or self-hosted vLLM / LM Studio server.
                  </p>
                </button>

              </div>
            </div>

            {/* Dynamic Inputs based on Provider */}
            {modelSettings.provider === 'gemini' ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Model Choice */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Gemini Model Name
                    </label>
                    <select
                      value={modelSettings.modelName}
                      onChange={e => onUpdateModelSettings({ modelName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended - Ultra Low Latency)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Quantitative Reasoning)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Fast Intraday Scalping)</option>
                    </select>
                  </div>

                  {/* Gemini API Key */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Gemini API Key (Leave empty to use server default)
                    </label>
                    <div className="relative">
                      <input
                        type={showModelKey ? 'text' : 'password'}
                        value={modelSettings.apiKey}
                        onChange={e => onUpdateModelSettings({ apiKey: e.target.value })}
                        placeholder="AIzaSy... (optional if configured in environment)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModelKey(!showModelKey)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showModelKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Local Model Configuration (Ollama / LM Studio) */
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Base URL */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Local Endpoint Base URL
                    </label>
                    <input
                      type="text"
                      value={modelSettings.baseUrl}
                      onChange={e => onUpdateModelSettings({ baseUrl: e.target.value })}
                      placeholder="http://localhost:11434/v1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Ollama default: <code className="text-slate-400">http://localhost:11434/v1</code> | LM Studio: <code className="text-slate-400">http://localhost:1234/v1</code>
                    </span>
                  </div>

                  {/* Local Model Name */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Local Model Tag / Name
                    </label>
                    <input
                      type="text"
                      value={modelSettings.modelName}
                      onChange={e => onUpdateModelSettings({ modelName: e.target.value })}
                      placeholder="e.g. llama3.2, deepseek-r1:7b, qwen2.5:14b"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Must match model pulled in your local Ollama / LM Studio library
                    </span>
                  </div>

                  {/* Optional Auth Header / Token for remote endpoints */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Authorization Bearer Token (Optional for secured local/remote proxies)
                    </label>
                    <input
                      type="password"
                      value={modelSettings.apiKey}
                      onChange={e => onUpdateModelSettings({ apiKey: e.target.value })}
                      placeholder="Optional API key or bearer token"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hyperparameters: Temperature & Max Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Inference Temperature</span>
                  <span className="font-mono text-emerald-400">{modelSettings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={modelSettings.temperature}
                  onChange={e => onUpdateModelSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Lower values (0.05 - 0.2) produce deterministic, disciplined technical verdicts.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Max Tokens Limit</span>
                  <span className="font-mono text-emerald-400">{modelSettings.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={modelSettings.maxTokens}
                  onChange={e => onUpdateModelSettings({ maxTokens: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Token budget allocated for structured JSON reasoning responses.
                </span>
              </div>
            </div>

            {/* Test Connection Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  modelSettings.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`} />
                <span className="text-xs text-slate-300">
                  Status: <strong className="text-white capitalize">{modelSettings.status}</strong>
                  {modelSettings.lastPingMs && ` (${modelSettings.lastPingMs}ms latency)`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestModel}
                disabled={isTestingModel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Wifi className={`w-3.5 h-3.5 ${isTestingModel ? 'animate-spin' : 'text-emerald-400'}`} />
                <span>{isTestingModel ? 'Pinging Model...' : 'Test Model Connection'}</span>
              </button>
            </div>

            {/* Test Result Message */}
            {modelTestResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                modelTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {modelTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-semibold">{modelTestResult.message}</div>
                  {modelTestResult.latencyMs && (
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Inference handshake latency: {modelTestResult.latencyMs}ms
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Local Model Setup Instructions */}
          <div className="space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Local Ollama Quickstart
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                To run completely offline on your own machine with zero cloud subscription fees:
              </p>

              <div className="space-y-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400">
                  curl -fsSL https://ollama.com/install.sh | sh
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400">
                  ollama run llama3.2:latest
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Enables high-speed zero-cloud quantitative decisions.</p>
                <p>• Ensures 100% privacy for proprietary trading strategies.</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-2">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Recommended Quant Models
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white">Llama 3.2 (3B / 1B)</span>
                  <span className="text-[10px] font-mono text-emerald-400">Ultra-fast ~18ms</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white">DeepSeek-R1 (7B / 14B)</span>
                  <span className="text-[10px] font-mono text-purple-400">Math Reasoning</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white">Qwen 2.5 Coder (7B)</span>
                  <span className="text-[10px] font-mono text-sky-400">JSON Precision</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: AGENT PROMPT ENGINEERING STUDIO */}
      {activeTab === 'prompts' && (
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  Agent System Prompts & Directive Customizer
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fine-tune the exact persona, reasoning steps, and technical guardrails passed to your AI model for NSE/BSE market analysis.
                </p>
              </div>

              <button
                type="button"
                onClick={onResetPrompts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition-all w-fit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>

            {/* Prompt 1: Market Regime Prompt */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>1. Market Regime Classification & Dynamic Strategy Optimizer Prompt</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Evaluates live NIFTY, BANKNIFTY & market breadth
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Variables injected at runtime: <code className="text-emerald-400 font-mono">&#123;marketData&#125;</code>, <code className="text-emerald-400 font-mono">&#123;activeStrategy&#125;</code>, <code className="text-emerald-400 font-mono">&#123;currentPositions&#125;</code>
              </p>
              <textarea
                rows={7}
                value={agentPrompts.marketRegimePrompt}
                onChange={e => onUpdateAgentPrompts({ marketRegimePrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Prompt 2: Single Stock Analysis Prompt */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>2. Scrip Technical Analysis & Autonomous Trade Verdict Prompt</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Inspects RSI, Supertrend, VWAP, EMA ribbons & orderbook
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Variables injected at runtime: <code className="text-emerald-400 font-mono">&#123;symbol&#125;</code>, <code className="text-emerald-400 font-mono">&#123;exchange&#125;</code>, <code className="text-emerald-400 font-mono">&#123;ltp&#125;</code>, <code className="text-emerald-400 font-mono">&#123;indicators&#125;</code>, <code className="text-emerald-400 font-mono">&#123;timeframe&#125;</code>
              </p>
              <textarea
                rows={7}
                value={agentPrompts.stockAnalysisPrompt}
                onChange={e => onUpdateAgentPrompts({ stockAnalysisPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Prompt 3: Risk Management Directive */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>3. Autonomous Risk Management & Exit Discipline Policy Prompt</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Enforces Stop-Loss, Trailing stops, and daily circuit rules
                </span>
              </div>
              <textarea
                rows={5}
                value={agentPrompts.riskRulesPrompt}
                onChange={e => onUpdateAgentPrompts({ riskRulesPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: RISK & ORDER ROUTING SAFEGUARDS */}
      {activeTab === 'risk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Autonomous Risk Management & Order Execution Safeguards
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Parameters governing trade sizing, stop-loss calculation, circuit breakers, and statutory Indian market constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Capital Allocation */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Capital Allocated (₹ INR)
              </label>
              <input
                type="number"
                value={config.capitalAllocated}
                onChange={e => onUpdateConfig({ capitalAllocated: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Risk Per Trade % */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Risk Per Trade (% of Capital)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="5.0"
                value={config.riskPerTradePercent}
                onChange={e => onUpdateConfig({ riskPerTradePercent: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Risk Reward */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Target Risk : Reward Ratio (1 : X)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={config.targetRiskRewardRatio}
                onChange={e => onUpdateConfig({ targetRiskRewardRatio: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Max Concurrent Positions */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Max Open Positions
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.maxOpenPositions}
                onChange={e => onUpdateConfig({ maxOpenPositions: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Daily Circuit Breaker */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Daily Max Loss Circuit Breaker (₹)
              </label>
              <input
                type="number"
                value={config.dailyMaxLossLimit}
                onChange={e => onUpdateConfig({ dailyMaxLossLimit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Intraday Auto Square-off Time */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Intraday Auto Square-Off Time (IST)
              </label>
              <input
                type="text"
                value={config.intradayAutoSquareOffTime}
                onChange={e => onUpdateConfig({ intradayAutoSquareOffTime: e.target.value })}
                placeholder="15:15"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Dynamic Trailing Stop Loss</span>
                <span className="text-[11px] text-slate-400">
                  Automatically ratchets up stop loss as price advances into profit.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.trailingSlEnabled}
                onChange={e => onUpdateConfig({ trailingSlEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Autonomous AI Dynamic Strategy Adjustment</span>
                <span className="text-[11px] text-slate-400">
                  Allows model to switch strategies when market volatility shifts from Trending to Choppy.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.autoStrategyAdjustment}
                onChange={e => onUpdateConfig({ autoStrategyAdjustment: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
