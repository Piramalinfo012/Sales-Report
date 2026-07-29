import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from './DashboardContainer';
import {
  Sun,
  Moon,
  Compass,
  CheckCircle2,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface SalesDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ onNavigate }) => {
  const { authState, morningPlans, eveningReports, captureGPSLocation } = useAuth();
  const user = authState.user;

  // Filter for logged-in user
  const userPlans = morningPlans.filter(p => p.salesPersonId === user?.id || p.salesPersonName === user?.userName);
  const userReports = eveningReports.filter(r => r.salesPersonId === user?.id || r.salesPersonName === user?.userName);

  const pendingVisits = userPlans.length - userReports.length;
  const totalBusinessGoal = userPlans.reduce((sum, p) => sum + (p.expectedBusiness || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            Field Officer Portal
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Hello, {user?.userName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manager: <span className="text-white font-medium">{user?.manager}</span> | CRM ID: <span className="font-mono text-sky-600">{user?.crm}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('morning_plan')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Sun className="w-4 h-4" />
            <span>Submit Morning Plan</span>
          </button>
          <button
            onClick={() => onNavigate('evening_report')}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
            <span>Update Evening Report</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Planned Meetings Today</span>
          <div className="text-2xl font-bold text-white">{userPlans.length}</div>
          <p className="text-[11px] text-amber-400 font-medium">Target: ₹{(totalBusinessGoal || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Visits Completed</span>
          <div className="text-2xl font-bold text-emerald-400">{userReports.length}</div>
          <p className="text-[11px] text-slate-400">Outcome logged to Sheet</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Pending Visits</span>
          <div className="text-2xl font-bold text-rose-400">{Math.max(0, pendingVisits)}</div>
          <p className="text-[11px] text-slate-400">Action required before 6 PM</p>
        </div>
      </div>

      {/* Today's Schedule List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>My Planned Visits</span>
          </h2>
          <button
            onClick={() => onNavigate('morning_plan')}
            className="text-xs text-sky-600 hover:underline font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {userPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-bold text-sm text-white">{plan.partyName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contact: {plan.contactPerson} ({plan.mobileNumber}) | City: {plan.city}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-400">
                  ₹{(plan.expectedBusiness || 0).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onNavigate('evening_report')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-600 text-xs font-semibold"
                >
                  Log Visit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
