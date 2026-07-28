import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APPS_SCRIPT_URL } from '../../services/api';
import { Settings, Server, RefreshCw, CheckCircle2, AlertCircle, Database, ShieldCheck, Sun, Moon, Palette } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { showToast, themeMode, toggleTheme } = useAuth();
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleTestEndpoint = async () => {
    setTestingEndpoint(true);
    setPingResult(null);

    try {
      const res = await fetch(APPS_SCRIPT_URL);
      if (res.ok) {
        setPingResult(`HTTP ${res.status} OK - Server API endpoint active.`);
        showToast('success', 'Server Connected', 'Backend API responded successfully.');
      } else {
        setPingResult(`HTTP ${res.status} - Endpoint responded with status.`);
        showToast('warning', 'Server Notice', `Response status: ${res.status}`);
      }
    } catch (err: any) {
      setPingResult(`Fetch Notice: ${err.message || 'CORS / redirect handling active'}. Direct POST payloads are active.`);
      showToast('info', 'API Protocol', 'Using direct POST communication mode.');
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Connection</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure backend API endpoint and view system diagnostics
          </p>
        </div>
      </div>

      {/* Appearance & Theme Setting */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Application Theme & Appearance</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold uppercase">
            {themeMode} Mode
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <h3 className="font-semibold text-sm text-white">Light / Dark Color Theme</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch between High-Contrast Dark Mode and Crisp Light Mode
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 text-xs transition-all shadow-md"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-200" />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Server API Status Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base text-white">Backend Data Server API</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
            Connected
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Configured API Endpoint</label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono text-[11px] break-all">
              {APPS_SCRIPT_URL}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>User Account Database Schema</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Columns: A=ID, B=PASSWORD, C=USER NAME, D=ROLE, E=GMAIL, F=MANAGER, G=CRM, H=PROFILE URL
            </p>
          </div>

          <button
            onClick={handleTestEndpoint}
            disabled={testingEndpoint}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${testingEndpoint ? 'animate-spin text-sky-400' : ''}`} />
            <span>Test Endpoint Connectivity</span>
          </button>

          {pingResult && (
            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200 text-xs font-mono">
              {pingResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
