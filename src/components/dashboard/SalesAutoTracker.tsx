import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { insertSheetRow } from '../../services/api';
import { Route, Play, Square, Settings, LogOut, Loader2, Navigation, AlertTriangle } from 'lucide-react';

export const SalesAutoTracker: React.FC = () => {
  const { authState, logout, showToast } = useAuth();
  const [deviceNumber, setDeviceNumber] = useState(authState.user?.id || '');
  const [intervalMins, setIntervalMins] = useState(15);
  const [isTracking, setIsTracking] = useState(false);
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  
  const intervalRef = useRef<number | null>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50)); // keep last 50 logs
  };

  const syncLocation = async () => {
    if (!deviceNumber) return;
    addLog('Requesting GPS location...', 'info');

    if (!navigator.geolocation) {
      addLog('GPS not supported on this browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        addLog(`Got location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const dateStr = `${d}-${m}-${y} ${time}`;

        // Row structure for "GPS" sheet:
        // A: Transporter, B: Recipient, C: Vehicle, D: Resource, E: Device, F: Date, G: Address, H: Lat, I: Lng, J: Accuracy
        const rowData = [
          '', // Transporter
          '', // Recipient
          '', // Vehicle
          authState.user?.userName || deviceNumber, // Resource Name
          deviceNumber, // Device Number
          dateStr, // Result Date
          'Auto Tracked via App', // Address
          lat,
          lng,
          acc
        ];

        try {
          addLog('Syncing to Google Sheets...', 'info');
          const success = await insertSheetRow('GPS', rowData);
          if (success) {
            addLog('Successfully saved to GPS sheet!', 'success');
          } else {
            addLog('Failed to save to sheet. Retrying next cycle.', 'warn');
          }
        } catch (err) {
          addLog('Network error while syncing.', 'error');
        }
      },
      (error) => {
        let errStr = 'Unknown GPS Error';
        if (error.code === 1) errStr = 'Permission Denied. Please allow location access.';
        if (error.code === 2) errStr = 'Position Unavailable. Turn on GPS.';
        if (error.code === 3) errStr = 'Timeout getting location.';
        addLog(errStr, 'error');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const toggleTracking = () => {
    if (!deviceNumber) {
      showToast('error', 'Missing Input', 'Please enter your Mobile/Device Number first.');
      return;
    }

    if (isTracking) {
      setIsTracking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      addLog('Tracking stopped.', 'warn');
    } else {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(()=>{}, ()=>{}, {enableHighAccuracy: true});
      }
      setIsTracking(true);
      addLog(`Started auto-tracking every ${intervalMins} minute(s).`, 'success');
      
      syncLocation();

      intervalRef.current = window.setInterval(() => {
        syncLocation();
      }, intervalMins * 60 * 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      
      <div className="absolute top-4 right-4 flex items-center gap-4">
         <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300">
           <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs border border-emerald-500/30">
              {authState.user?.userName?.charAt(0).toUpperCase()}
           </div>
           {authState.user?.userName}
         </div>
         <button onClick={logout} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
         </button>
      </div>

      <div className="max-w-md w-full flex flex-col mt-12 lg:mt-0">
        <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isTracking ? 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border-slate-700'}`}>
                {isTracking ? (
                    <Navigation className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                    <Navigation className="w-8 h-8 text-slate-500" />
                )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GPS Auto Tracker</h1>
            <p className="text-sm text-slate-400">Sales tracking system - Keep this open</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-2xl">
            <div className="mb-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 pl-1">Device / Mobile Number</label>
                <input 
                  type="text" 
                  value={deviceNumber}
                  onChange={e => setDeviceNumber(e.target.value)}
                  disabled={isTracking}
                  placeholder="Enter your 10-digit number" 
                  className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50" 
                />
            </div>

            <div className="mb-6">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 pl-1">Update Interval</label>
                <select 
                  value={intervalMins}
                  onChange={e => setIntervalMins(Number(e.target.value))}
                  disabled={isTracking}
                  className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none disabled:opacity-50"
                >
                    <option value={1}>Every 1 Minute (Testing)</option>
                    <option value={5}>Every 5 Minutes</option>
                    <option value={15}>Every 15 Minutes</option>
                    <option value={30}>Every 30 Minutes</option>
                    <option value={60}>Every 1 Hour</option>
                </select>
            </div>

            <button 
              onClick={toggleTracking}
              className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                isTracking 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
              }`}
            >
                {isTracking ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isTracking ? 'STOP TRACKING' : 'START TRACKING'}</span>
            </button>
        </div>

        {isTracking && (
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-4 mb-6 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
             <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                 <strong className="text-amber-400">Important:</strong> Do not close this app. You can lower your brightness, but keeping the screen active ensures perfect tracking.
             </p>
          </div>
        )}

        <div className="flex-1 min-h-[200px] bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <Settings className="w-4 h-4" /> Sync Log
                </h3>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${isTracking ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                   {isTracking ? 'ONLINE & SYNCING' : 'OFFLINE'}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[250px] pr-2">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-8">No data sent yet.</p>
                ) : (
                  logs.map((log, i) => {
                    let color = 'text-slate-300';
                    if (log.type === 'success') color = 'text-emerald-400';
                    if (log.type === 'error') color = 'text-red-400';
                    if (log.type === 'warn') color = 'text-amber-400';
                    return (
                      <div key={i} className={`text-[11px] ${color} flex items-start gap-2.5 border-l-2 border-slate-800 pl-3 py-1`}>
                          <span className="text-slate-500 font-medium whitespace-nowrap">[{log.time}]</span> 
                          <span className="leading-relaxed font-medium">{log.msg}</span>
                      </div>
                    );
                  })
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
