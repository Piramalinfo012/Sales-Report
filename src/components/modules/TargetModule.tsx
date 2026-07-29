import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchTargetsFromSheet, assignTargetToSheet, fetchSalesPersonsFromLoginSheet, fetchCRMOrdersFromSheet } from '../../services/api';
import { TargetRecord, CRMOrderRecord } from '../../types';
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
  ChevronDown,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const formatMonthDisplay = (val: any): string => {
  if (!val) return 'July 2026';
  const str = String(val).trim();
  if (!str) return 'July 2026';

  // If already in Month Year format (e.g. "July 2026" or "June 2026")
  if (/^[A-Za-z]+\s+\d{4}$/.test(str)) {
    return str;
  }

  // If ISO date string or YYYY-MM date (e.g. "2026-06-30T18:30:00.000Z")
  if (str.includes('T') || (str.includes('-') && str.length >= 7 && str.startsWith('202'))) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      // Adjust by IST (+5.5 hrs) for UTC date bounds from Google Sheets
      const localDate = new Date(d.getTime() + (5.5 * 3600 * 1000));
      return `${monthNames[localDate.getUTCMonth()]} ${localDate.getUTCFullYear()}`;
    }
  }

  // Parse DD/MM/YYYY or DD-MM-YYYY
  const dmMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmMatch) {
    const month = parseInt(dmMatch[2], 10) - 1;
    const year = dmMatch[3];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month]} ${year}`;
  }

  // If numeric Excel date serial
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[jsDate.getMonth()]} ${jsDate.getFullYear()}`;
    }
  }

  return str;
};

export const TargetModule: React.FC = () => {
  const { authState, showToast } = useAuth();
  const user = authState.user;

  // Real data state from Google Sheet
  const [targets, setTargets] = useState<TargetRecord[]>([]);
  const [crmOrders, setCrmOrders] = useState<CRMOrderRecord[]>([]);
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

  // Edit Target State
  const [editingTarget, setEditingTarget] = useState<TargetRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch real targets and sales persons on mount
  const loadTargets = async () => {
    setLoading(true);
    try {
      const [targetsData, crmOrdersData] = await Promise.all([
        fetchTargetsFromSheet(),
        fetchCRMOrdersFromSheet()
      ]);
      setTargets(targetsData);
      setCrmOrders(crmOrdersData);
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
      showToast('success', 'Target Assigned!', `Target successfully assigned to ${salesPersonName}.`);

      // Reset form defaults
      setRemark('');
    } catch (err: any) {
      showToast('error', 'Assignment Error', err.message || 'Failed to record target.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;
    setIsUpdating(true);
    try {
      setTargets(prev => prev.map(t => (t.id === editingTarget.id ? editingTarget : t)));
      showToast('success', 'Target Updated', 'The target record has been updated.');
      setEditingTarget(null);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update target.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTarget = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target record?')) return;
    setTargets(prev => prev.filter(t => t.id !== id));
    showToast('success', 'Target Deleted', 'The target record has been removed.');
  };

  // Filter targets
  const filteredTargets = targets.filter(t => {
    const formattedMonth = formatMonthDisplay(t.month);
    const matchesSearch =
      t.salesPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.month || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth =
      selectedMonthFilter === 'All' ||
      formattedMonth.toLowerCase() === selectedMonthFilter.toLowerCase() ||
      (t.month || '').toLowerCase() === selectedMonthFilter.toLowerCase();

    return matchesSearch && matchesMonth;
  });

  // Helper to calculate achieved orders for a target
  const getAchievedCount = (target: TargetRecord): number => {
    const targetMonth = formatMonthDisplay(target.month);
    return crmOrders.filter(order => {
      // 1. Match Sales Person Name
      const isSamePerson = order.salesPersonName.trim().toLowerCase() === target.salesPersonName.trim().toLowerCase();
      if (!isSamePerson) return false;

      // 2. Order status must be 'Recieved' (checking both spellings just in case)
      const statusLower = (order.orderStatus || '').toLowerCase();
      const isReceived = statusLower.includes('recieved') || statusLower.includes('received');
      if (!isReceived) return false;

      // 3. Order Actual Date's month must strictly match Target Month
      const orderMonth = formatMonthDisplay(order.orderActualDate);
      return orderMonth === targetMonth;
    }).length;
  };

  // Calculate total targets summary
  const totalAssignedAmount = targets.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalAssignedOrders = targets.reduce((sum, t) => sum + (t.totalNewOrders || 0), 0);
  const totalAchievedOrders = targets.reduce((sum, t) => sum + getAchievedCount(t), 0);

  // User-specific target
  const userTarget = targets.find(t => t.salesPersonName.toLowerCase().includes((user?.userName || '').toLowerCase())) || targets[0];
  const userAchievedOrders = userTarget ? getAchievedCount(userTarget) : 0;

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
                System Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Assign and monitor monthly sales targets, new order quotas, and revenue goals
            </p>
          </div>
        </div>

        <button
          onClick={loadTargets}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Targets</span>
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

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total New Orders Progress</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-black text-sky-600 font-mono">
                {totalAchievedOrders} <span className="text-sm text-slate-500 font-medium">/ {totalAssignedOrders}</span>
              </div>
              <div className="text-xs font-bold text-emerald-400">
                {totalAssignedOrders > 0 ? Math.round((totalAchievedOrders / totalAssignedOrders) * 100) : 0}%
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-1000 relative" 
                style={{ width: `${totalAssignedOrders > 0 ? Math.min((totalAchievedOrders / totalAssignedOrders) * 100, 100) : 0}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>My Active Monthly Target</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 font-mono mb-1">
              ₹{(userTarget?.amount || 500000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-300 truncate mb-3">
              {formatMonthDisplay(userTarget?.month)}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>Orders Progress</span>
                <span className="text-amber-400">
                  {userAchievedOrders} / {userTarget?.totalNewOrders || 10}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-1000 relative" 
                  style={{ width: `${(userTarget?.totalNewOrders || 10) > 0 ? Math.min((userAchievedOrders / (userTarget?.totalNewOrders || 10)) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>
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
                  <span>Assigning Target...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assign Target</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Target Live Data Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-base text-white">Target Records ({filteredTargets.length})</h2>
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
                <th className="p-3">Target Progress</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Remark</th>
                <th className="p-3 rounded-r-xl text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>Fetching target records...</span>
                  </td>
                </tr>
              ) : filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No target records found. Assign a target above to insert data.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-sky-600 font-semibold">{t.id}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{getIndianDateTimeString(t.timestamp)}</td>
                    <td className="p-3 font-semibold text-slate-200">{formatMonthDisplay(t.month)}</td>
                    <td className="p-3 font-medium text-white">{t.salesPersonName}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                          <span className="text-emerald-400">{getAchievedCount(t)} Achieved</span>
                          <span className="text-slate-500">/ {t.totalNewOrders}</span>
                        </div>
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${t.totalNewOrders > 0 ? Math.min((getAchievedCount(t) / t.totalNewOrders) * 100, 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-black">
                      ₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{t.remark || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditingTarget(t)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTarget(t.id)} className="p-1.5 bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 rounded-lg transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT TARGET MODAL */}
      <AnimatePresence>
        {editingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Edit Target</h2>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{editingTarget.id}</p>
                  </div>
                </div>
                <button onClick={() => setEditingTarget(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTarget} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Sales Person Name <span className="text-rose-400">*</span></label>
                    <select
                      value={editingTarget.salesPersonName}
                      onChange={(e) => setEditingTarget({ ...editingTarget, salesPersonName: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none appearance-none"
                      required
                    >
                      {salesPersonsList.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Month <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={editingTarget.month}
                      onChange={(e) => setEditingTarget({ ...editingTarget, month: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Orders (Qty) <span className="text-rose-400">*</span></label>
                    <input
                      type="number"
                      value={editingTarget.totalNewOrders}
                      onChange={(e) => setEditingTarget({ ...editingTarget, totalNewOrders: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Amount (₹) <span className="text-rose-400">*</span></label>
                    <input
                      type="number"
                      value={editingTarget.amount}
                      onChange={(e) => setEditingTarget({ ...editingTarget, amount: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Remark</label>
                  <input
                    type="text"
                    value={editingTarget.remark}
                    onChange={(e) => setEditingTarget({ ...editingTarget, remark: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setEditingTarget(null)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50">
                    {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
