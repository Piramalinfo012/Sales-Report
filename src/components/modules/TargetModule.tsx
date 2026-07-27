import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchTargetsFromSheet, assignTargetToSheet, fetchSalesPersonsFromLoginSheet } from '../../services/api';
import { TargetRecord } from '../../types';
import { getIndianDateTimeString } from '../../utils/dateUtils';
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  Award,
  Clock,
  MessageSquare,
  Package,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const TargetModule: React.FC = () => {
  const { authState, showToast } = useAuth();
  const user = authState.user;

  // Real data state from Google Sheet
  const [targets, setTargets] = useState<TargetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Salespersons list fetched from Login sheet Column C (USER NAME)
  const [salesPersonsList, setSalesPersonsList] = useState<string[]>([
    'Atul Baghmar',
    'Pamendra Singh Rajput',
    'Neha Garg',
    'Pradeep Kumar',
    'ADMIN',
    'Anas Siddique',
    'Vivek Yadav',
    'Jaspreet Singh',
    'Bhushan Singh Chouhan',
    'Pankaj Kumar',
    'Devi Naidu',
  ]);

  // Form states for assigning target
  const [salesPersonName, setSalesPersonName] = useState(
    user?.userName || 'Atul Baghmar'
  );
  const [month, setMonth] = useState('July 2026');
  const [totalNewOrders, setTotalNewOrders] = useState('10');
  const [amount, setAmount] = useState('500000');
  const [remark, setRemark] = useState('Monthly Sales Target Assignment');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('All');

  // Fetch real targets and sales persons on mount
  const loadTargets = async () => {
    setLoading(true);
    try {
      const data = await fetchTargetsFromSheet();
      setTargets(data);
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
    fetchSalesPersonsFromLoginSheet().then(names => {
      if (names && names.length > 0) {
        setSalesPersonsList(names);
        // Ensure default selected name is valid
        if (!salesPersonName || !names.includes(salesPersonName)) {
          setSalesPersonName(names[0]);
        }
      }
    });
  }, []);

  const handleAssignTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesPersonName.trim()) {
      showToast('error', 'Required Field', 'Please enter or select a Sales Person Name.');
      return;
    }

    setIsAssigning(true);
    try {
      const newRecord = await assignTargetToSheet({
        month,
        salesPersonName: salesPersonName.trim(),
        totalNewOrders: Number(totalNewOrders) || 0,
        amount: Number(amount) || 0,
        remark: remark.trim(),
      });

      setTargets(prev => [newRecord, ...prev]);
      showToast('success', 'Target Assigned!', `Target successfully assigned to ${salesPersonName} in Google Sheet.`);

      // Reset form defaults
      setRemark('');
    } catch (err: any) {
      showToast('error', 'Assignment Error', err.message || 'Failed to record target in Google Sheet.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter targets
  const filteredTargets = targets.filter(t => {
    const matchesSearch =
      t.salesPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.month.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth = selectedMonthFilter === 'All' || t.month === selectedMonthFilter;

    return matchesSearch && matchesMonth;
  });

  // Calculate total targets summary
  const totalAssignedAmount = targets.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalAssignedOrders = targets.reduce((sum, t) => sum + (t.totalNewOrders || 0), 0);

  // User-specific target
  const userTarget = targets.find(t => t.salesPersonName.toLowerCase().includes((user?.userName || '').toLowerCase())) || targets[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-950/50">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Sales Target Assignment</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-semibold">
                Live Google Sheet Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Assign and monitor monthly sales targets, new order quotas, and revenue goals synchronized with Google Sheets
            </p>
          </div>
        </div>

        <button
          onClick={loadTargets}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Sheet Data</span>
        </button>
      </div>

      {/* Target Key Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Revenue Target Assigned</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{(totalAssignedAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Across {targets.length} assigned goals</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total New Orders Quota</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {totalAssignedOrders} Orders
          </div>
          <div className="text-[11px] text-slate-400">
            Target new order count expected
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>My Active Monthly Target</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{(userTarget?.amount || 500000).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {userTarget?.month || 'July 2026'} • {userTarget?.totalNewOrders || 10} Orders Goal
          </div>
        </div>
      </div>

      {/* Assign Target Form (Visible to Admin/Manager or for direct assignment) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Assign New Target (Add to Target Sheet)</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sheet: Target</span>
        </div>

        <form onSubmit={handleAssignTarget} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Person Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Sales Person Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 z-10 pointer-events-none" />
                <select
                  value={salesPersonName}
                  onChange={(e) => setSalesPersonName(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Select Sales Person --</option>
                  {salesPersonsList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Month <span className="text-rose-400">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="July 2026">July 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>
            </div>

            {/* Total New Orders */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total New Orders Quota</label>
              <input
                type="number"
                value={totalNewOrders}
                onChange={(e) => setTotalNewOrders(e.target.value)}
                placeholder="10"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500000"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Remark / Notes</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Focus on Industrial lubricant accounts in North Zone"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAssigning}
              className="py-3 px-6 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {isAssigning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Assigning to Google Sheet...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assign Target to Sheet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Target Sheet Live Data Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base text-white">Target Sheet Records ({filteredTargets.length})</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search salesperson..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Months</option>
              <option value="July 2026">July 2026</option>
              <option value="August 2026">August 2026</option>
            </select>
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Month</th>
                <th className="p-3">Sales Person Name</th>
                <th className="p-3 text-right">Total New Orders</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 rounded-r-xl">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                    <span>Fetching live records from Google Sheet 'Target'...</span>
                  </td>
                </tr>
              ) : filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No target records found in 'Target' sheet. Assign a target above to insert data.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-sky-400 font-semibold">{t.id}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{getIndianDateTimeString(t.timestamp)}</td>
                    <td className="p-3 font-semibold text-slate-200">{t.month}</td>
                    <td className="p-3 font-medium text-white">{t.salesPersonName}</td>
                    <td className="p-3 text-right font-mono text-sky-300 font-bold">
                      {t.totalNewOrders}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-black">
                      ₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{t.remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
