import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity, Shield } from 'lucide-react';

export const AnalyticsModule: React.FC = () => {
  const { morningPlans, eveningReports } = useAuth();

  // --- Chart data derived from real records (no demo/sample values) ---

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Parse a stored DD-MM-YYYY (or YYYY-MM-DD) date string into a 0-based month index
  const getMonthIndex = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const parts = String(dateStr).split(/[-/]/).map(p => p.trim());
    if (parts.length < 2) return null;
    // Month sits at index 1 for both DD-MM-YYYY and YYYY-MM-DD
    const m = Number(parts[1]);
    if (!m || m < 1 || m > 12) return null;
    return m - 1;
  };

  // 1. City-wise: planned business (target) vs reported order value (actual)
  const cityMap = new Map<string, { city: string; target: number; actual: number }>();
  morningPlans.forEach(p => {
    const city = (p.city || '').trim() || 'Other';
    const entry = cityMap.get(city) || { city, target: 0, actual: 0 };
    entry.target += Number(p.expectedBusiness) || 0;
    cityMap.set(city, entry);
  });
  eveningReports.forEach(r => {
    const plan = morningPlans.find(p => p.id === r.morningPlanId);
    const city = ((plan?.city) || '').trim() || 'Other';
    const entry = cityMap.get(city) || { city, target: 0, actual: 0 };
    entry.actual += Number(r.expectedOrder) || 0;
    cityMap.set(city, entry);
  });
  const cityData = Array.from(cityMap.values());

  // 2. Priority breakup of planned meetings
  const priorityMeta: Record<string, string> = { High: '#f43f5e', Medium: '#f59e0b', Low: '#38bdf8' };
  const priorityCounts: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
  morningPlans.forEach(p => {
    const key = p.priority && priorityCounts[p.priority] !== undefined ? p.priority : 'Medium';
    priorityCounts[key] += 1;
  });
  const priorityDistribution = Object.keys(priorityMeta)
    .filter(name => priorityCounts[name] > 0)
    .map(name => ({ name: `${name} Priority`, value: priorityCounts[name], color: priorityMeta[name] }));

  // 3 & 4. Monthly trend: visit counts (plans) and order value (reports)
  const monthMap = new Map<number, { month: string; visits: number; orders: number }>();
  morningPlans.forEach(p => {
    const idx = getMonthIndex(p.meetingDate);
    if (idx === null) return;
    const entry = monthMap.get(idx) || { month: MONTHS[idx], visits: 0, orders: 0 };
    entry.visits += 1;
    monthMap.set(idx, entry);
  });
  eveningReports.forEach(r => {
    const plan = morningPlans.find(p => p.id === r.morningPlanId);
    const idx = getMonthIndex(plan?.meetingDate);
    if (idx === null) return;
    const entry = monthMap.get(idx) || { month: MONTHS[idx], visits: 0, orders: 0 };
    entry.orders += Number(r.expectedOrder) || 0;
    monthMap.set(idx, entry);
  });
  const monthlyTrend = Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-800/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-lg shadow-teal-950/40">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sales Analytics & Insights</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual metrics powered by Recharts (Bar, Pie, Area & Line charts)
          </p>
        </div>
      </div>

      {/* Grid of 4 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Bar Chart: City-wise Business Target vs Actual */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>City-Wise Target vs Actual (Bar Chart)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="city" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="target" name="Target ₹" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual ₹" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Pie Chart: Lead Priority Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              <span>Meeting Priority Breakup (Pie Chart)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Area Chart: Monthly Business Growth Trend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Revenue Growth Trend (Area Chart)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Area type="monotone" dataKey="orders" name="Order Value ₹" stroke="#10b981" fill="#10b98122" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Line Chart: Field Visits Velocity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Field Visits Velocity (Line Chart)</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Line type="monotone" dataKey="visits" name="Visits Count" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
