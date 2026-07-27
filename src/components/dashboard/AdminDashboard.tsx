import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getIndianDateString } from '../../utils/dateUtils';
import {
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Navigation,
  TrendingUp,
  FileText,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { NavigationTab } from './DashboardContainer';

interface AdminDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { morningPlans, eveningReports, gpsRecords, customers } = useAuth();

  // Metrics calculations
  const totalPlans = morningPlans.length;
  const completedVisits = eveningReports.filter(r => r.status === 'Completed').length;
  const pendingPlans = morningPlans.filter(p => p.status === 'Pending').length;
  const followUps = eveningReports.filter(r => r.followUpDate).length;
  const totalOrderValue = eveningReports.reduce((acc, r) => acc + (r.expectedOrder || 0), 0);
  const activeGpsUsers = new Set(gpsRecords.map(r => r.salesPersonId)).size;
  const totalSalesPersons = 3; // Demo active headcount

  const cards = [
    {
      title: "Today's Plans",
      value: totalPlans,
      icon: CalendarCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      tab: 'morning_plan' as NavigationTab,
    },
    {
      title: "Today's Visits",
      value: eveningReports.length,
      icon: FileText,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      tab: 'evening_report' as NavigationTab,
    },
    {
      title: 'Completed Visits',
      value: completedVisits,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      tab: 'evening_report' as NavigationTab,
    },
    {
      title: 'Pending Visits',
      value: pendingPlans,
      icon: Clock,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      tab: 'morning_plan' as NavigationTab,
    },
    {
      title: 'Follow-ups Scheduled',
      value: followUps,
      icon: TrendingUp,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      tab: 'reports' as NavigationTab,
    },
    {
      title: 'Expected Orders',
      value: `₹${(totalOrderValue || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      tab: 'analytics' as NavigationTab,
    },
    {
      title: 'GPS Active Users',
      value: activeGpsUsers,
      icon: Navigation,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      tab: 'gps_tracking' as NavigationTab,
    },
    {
      title: 'Sales Person Count',
      value: totalSalesPersons,
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      tab: 'customers' as NavigationTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Sales Activity & Google Sheets Master Summary
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              onClick={() => onNavigate(card.tab)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className="text-2xl font-bold text-white mt-0.5 tracking-tight">
                  {card.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Team Today Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="font-bold text-sm text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          <span>Recent Field Activity Feed</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4">Party / Client</th>
                <th className="py-3 px-4">Meeting Date</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Business Goal</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {morningPlans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{p.salesPersonName}</td>
                  <td className="py-3 px-4">{p.partyName}</td>
                  <td className="py-3 px-4">{getIndianDateString(p.meetingDate)}</td>
                  <td className="py-3 px-4">{p.city}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    ₹{(p.expectedBusiness || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
