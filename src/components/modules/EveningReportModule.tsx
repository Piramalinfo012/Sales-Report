import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EveningReport, MorningPlan } from '../../types';
import { submitEveningReportToSheet } from '../../services/api';
import { getIndianDateString, convertDDMMYYYYToInputDate, convertInputDateToDDMMYYYY } from '../../utils/dateUtils';
import {
  Moon,
  Plus,
  Building,
  UserCheck,
  Phone,
  Briefcase,
  Calendar,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  Search,
  Filter,
  Edit3,
  Hash,
  Clock,
  User,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalesPersonGroup {
  salesPersonName: string;
  meetingDate: string;
  totalCompanies: number;
  completedCount: number;
  items: Array<{
    uid: string;
    date: string;
    salesPersonName: string;
    companyName: string;
    address: string;
    client: string;
    contactNumber: string;
    designation: string;
    remarks: string;
    nextFollowUpDate: string;
    isUpdated: boolean;
    planObj?: MorningPlan;
    reportObj?: EveningReport;
  }>;
}

export const EveningReportModule: React.FC = () => {
  const { authState, eveningReports, addEveningReport, morningPlans, captureGPSLocation, showToast } = useAuth();
  const user = authState.user;

  const [showModal, setShowModal] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<SalesPersonGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');

  // Active item being updated
  const [activePlan, setActivePlan] = useState<MorningPlan | null>(null);

  // Form states matching 10 Google Sheet columns:
  // Col A: Uid | Col B: Date | Col C: Sales Person Name | Col D: Company Name | Col E: Address | Col F: Client | Col G: Contact Number | Col H: Designation | Col I: Remarks | Col J: Next Follow Up Date
  const [uid, setUid] = useState('');
  const [reportDate, setReportDate] = useState(getIndianDateString());
  const [salesPersonName, setSalesPersonName] = useState('');
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    getIndianDateString(new Date(Date.now() + 86400000 * 3))
  );

  // Open update modal for a specific Morning Plan / Company item
  const openUpdateModal = (plan?: MorningPlan, existingReport?: EveningReport, defaultSalesPerson?: string, defaultParty?: string, defaultDate?: string, defaultUid?: string, defaultAddress?: string, defaultClient?: string, defaultContact?: string) => {
    if (plan) {
      setActivePlan(plan);
      setUid(plan.id);
      setReportDate(plan.meetingDate || getIndianDateString());
      setSalesPersonName(plan.salesPersonName || user?.userName || 'Sales Exec');
      setPartyName(plan.partyName);
      setAddress(plan.address || plan.city || '');
      setClient(existingReport?.client || plan.contactPerson || '');
      setContactNumber(existingReport?.contactNumber || plan.mobileNumber || '');
      setDesignation(existingReport?.designation || '');
      setRemarks(existingReport?.remarks || existingReport?.discussion || plan.remarks || '');
      setNextFollowUpDate(existingReport?.followUpDate || getIndianDateString(new Date(Date.now() + 86400000 * 3)));
    } else if (existingReport) {
      setActivePlan(null);
      setUid(existingReport.morningPlanId || existingReport.id);
      setReportDate(existingReport.meetingDate || getIndianDateString());
      setSalesPersonName(existingReport.salesPersonName || user?.userName || 'Sales Exec');
      setPartyName(existingReport.partyName);
      setAddress(existingReport.address || '');
      setClient(existingReport.client || '');
      setContactNumber(existingReport.contactNumber || '');
      setDesignation(existingReport.designation || '');
      setRemarks(existingReport.remarks || existingReport.discussion || '');
      setNextFollowUpDate(existingReport.followUpDate || getIndianDateString(new Date(Date.now() + 86400000 * 3)));
    } else {
      setActivePlan(null);
      setUid(defaultUid || 'MP-' + Date.now());
      setReportDate(defaultDate || getIndianDateString());
      setSalesPersonName(defaultSalesPerson || user?.userName || 'Sales Exec');
      setPartyName(defaultParty || '');
      setAddress(defaultAddress || '');
      setClient(defaultClient || '');
      setContactNumber(defaultContact || '');
      setDesignation('');
      setRemarks('');
      setNextFollowUpDate(getIndianDateString(new Date(Date.now() + 86400000 * 3)));
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName) {
      showToast('error', 'Incomplete Form', 'Please enter Company Name.');
      return;
    }

    setIsSubmitting(true);

    // Capture GPS coordinates for visit check-in
    const gpsRec = await captureGPSLocation('Evening Follow Up Submission');

    const reportData: Omit<EveningReport, 'id' | 'submittedAt'> = {
      morningPlanId: uid || activePlan?.id || undefined,
      salesPersonId: user?.id || 'SALES01',
      salesPersonName: salesPersonName || user?.userName || 'Sales Exec',
      meetingDate: reportDate,
      partyName,
      address,
      client,
      contactNumber,
      designation,
      remarks,
      discussion: remarks,
      followUpDate: nextFollowUpDate ? getIndianDateString(nextFollowUpDate) : getIndianDateString(),
      visited: 'Yes',
      status: 'Completed',
      latitude: gpsRec?.latitude,
      longitude: gpsRec?.longitude,
    };

    try {
      const createdReport = await submitEveningReportToSheet(reportData);
      addEveningReport(createdReport);
      showToast('success', 'Evening Follow Up Saved', `Data for ${partyName} stored in 'Evening Follow Up' Google Sheet.`);

      setShowModal(false);
      
      // Update local group details state if modal is open
      if (selectedGroupDetails) {
        setSelectedGroupDetails(prev => {
          if (!prev) return null;
          const updatedItems = prev.items.map(item => {
            if (item.uid === uid || item.companyName === partyName) {
              return {
                ...item,
                client,
                contactNumber,
                designation,
                remarks,
                nextFollowUpDate: reportData.followUpDate,
                address,
                isUpdated: true,
                reportObj: createdReport
              };
            }
            return item;
          });
          return {
            ...prev,
            completedCount: updatedItems.filter(i => i.isUpdated).length,
            items: updatedItems
          };
        });
      }
    } catch (err: any) {
      showToast('error', 'Submission Error', err.message || 'Could not save report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine Morning Plans with Evening Reports so all planned companies are shown ("SAME DATA SHOW HONA CHAHIYE")
  const combinedDataList = useMemo(() => {
    const list: Array<{
      uid: string;
      date: string;
      salesPersonName: string;
      companyName: string;
      address: string;
      client: string;
      contactNumber: string;
      designation: string;
      remarks: string;
      nextFollowUpDate: string;
      isUpdated: boolean;
      planObj?: MorningPlan;
      reportObj?: EveningReport;
    }> = [];

    const processedUids = new Set<string>();

    // First map all Morning Plans
    morningPlans.forEach(plan => {
      if (!plan || !plan.id) return;

      // Find matching evening report if available
      const matchedReport = eveningReports.find(
        r => r.morningPlanId === plan.id || r.id === plan.id || (r.partyName === plan.partyName && r.meetingDate === plan.meetingDate)
      );

      list.push({
        uid: plan.id,
        date: plan.meetingDate,
        salesPersonName: plan.salesPersonName,
        companyName: plan.partyName,
        address: plan.address || plan.city || '',
        client: matchedReport?.client || plan.contactPerson || '',
        contactNumber: matchedReport?.contactNumber || plan.mobileNumber || '',
        designation: matchedReport?.designation || '',
        remarks: matchedReport?.remarks || matchedReport?.discussion || plan.remarks || '',
        nextFollowUpDate: matchedReport?.followUpDate || '',
        isUpdated: !!matchedReport,
        planObj: plan,
        reportObj: matchedReport,
      });

      processedUids.add(plan.id);
      if (matchedReport) {
        processedUids.add(matchedReport.id);
        if (matchedReport.morningPlanId) processedUids.add(matchedReport.morningPlanId);
      }
    });

    // Add remaining standalone Evening Reports if any
    eveningReports.forEach(report => {
      if (!report || !report.id) return;
      if (processedUids.has(report.id) || (report.morningPlanId && processedUids.has(report.morningPlanId))) {
        return;
      }

      list.push({
        uid: report.morningPlanId || report.id,
        date: report.meetingDate || getIndianDateString(),
        salesPersonName: report.salesPersonName,
        companyName: report.partyName,
        address: report.address || '',
        client: report.client || '',
        contactNumber: report.contactNumber || '',
        designation: report.designation || '',
        remarks: report.remarks || report.discussion || '',
        nextFollowUpDate: report.followUpDate || '',
        isUpdated: true,
        reportObj: report,
      });
    });

    return list;
  }, [morningPlans, eveningReports]);

  // Group items Sales Person-wise
  const groupedBySalesPerson = useMemo(() => {
    const map = new Map<string, SalesPersonGroup>();

    combinedDataList.forEach(item => {
      const matchesDate =
        selectedDateFilter === 'ALL' ||
        !selectedDateFilter ||
        item.date === selectedDateFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.uid.toLowerCase().includes(q) ||
        item.salesPersonName.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.contactNumber.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q);

      if (!matchesDate || !matchesSearch) return;

      const key = `${item.salesPersonName}___${item.date}`;
      if (!map.has(key)) {
        map.set(key, {
          salesPersonName: item.salesPersonName,
          meetingDate: item.date,
          totalCompanies: 0,
          completedCount: 0,
          items: [],
        });
      }

      const grp = map.get(key)!;
      grp.items.push(item);
      grp.totalCompanies += 1;
      if (item.isUpdated) grp.completedCount += 1;
    });

    return Array.from(map.values());
  }, [combinedDataList, selectedDateFilter, searchTerm]);

  // Unique Dates for filter dropdown
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    combinedDataList.forEach(item => {
      if (item.date) dates.add(item.date);
    });
    return Array.from(dates);
  }, [combinedDataList]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50 border border-sky-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-950/40">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Evening Follow Up</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sales Person wise data & updates stored in Google Sheet tab <strong className="text-amber-400 font-semibold">'Evening Follow Up'</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => openUpdateModal()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Evening Entry</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Sales Person, Company, Address, Client, Contact..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Meeting Dates ({uniqueDates.length})</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Person-Wise Cards Grid */}
      <div className="space-y-4">
        {groupedBySalesPerson.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <User className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-medium text-sm">No Sales Person entries found</p>
            <p className="text-xs text-slate-500">Create a Morning Plan or add an Evening entry to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedBySalesPerson.map((group, groupIdx) => (
              <div
                key={`sp-group-${group.salesPersonName}-${group.meetingDate}-${groupIdx}`}
                onClick={() => setSelectedGroupDetails(group)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-all space-y-4 cursor-pointer hover:shadow-xl hover:shadow-sky-950/20 group relative overflow-hidden"
              >
                {/* Person Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors text-sm">
                        {group.salesPersonName}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{group.meetingDate}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/60 font-semibold">
                    {group.completedCount} / {group.totalCompanies} Done
                  </span>
                </div>

                {/* Company Preview List */}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Planned Companies ({group.totalCompanies})
                  </p>
                  <ul className="space-y-1.5">
                    {group.items.slice(0, 4).map((item, idx) => (
                      <li key={`preview-${item.uid}-${idx}`} className="flex items-center justify-between text-xs truncate">
                        <span className="truncate font-medium flex items-center gap-1.5 text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isUpdated ? 'bg-emerald-400' : 'bg-amber-400'} shrink-0`}></span>
                          <span className="truncate">{item.companyName}</span>
                        </span>
                        {item.isUpdated ? (
                          <span className="text-[10px] text-emerald-400 font-semibold shrink-0 ml-2">Updated</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold shrink-0 ml-2">Pending</span>
                        )}
                      </li>
                    ))}
                    {group.items.length > 4 && (
                      <li className="text-[10px] text-slate-500 italic pt-1">
                        + {group.items.length - 4} more companies
                      </li>
                    )}
                  </ul>
                </div>

                {/* Click Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-sky-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Click to view & update companies</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Person Detail View Modal (Shows Companies & Update Buttons) */}
      <AnimatePresence>
        {selectedGroupDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full text-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {selectedGroupDetails.salesPersonName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedGroupDetails.meetingDate}</span>
                      <span className="mx-1">•</span>
                      <span className="text-amber-400 font-semibold">{selectedGroupDetails.totalCompanies} Planned Companies</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGroupDetails(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Companies List for this Sales Person */}
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a company below and click <strong className="text-sky-400">Update</strong> to log follow up details into <strong className="text-amber-400 font-semibold">'Evening Follow Up'</strong> sheet.
                </p>

                <div className="space-y-3">
                  {selectedGroupDetails.items.map((item, idx) => (
                    <div
                      key={`grp-item-${item.uid}-${idx}`}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            #{item.uid}
                          </span>
                          <h4 className="font-bold text-amber-400 text-sm">{item.companyName}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.isUpdated ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              Follow Up Saved
                            </span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pending Update
                            </span>
                          )}

                          <button
                            onClick={() => openUpdateModal(
                              item.planObj,
                              item.reportObj,
                              item.salesPersonName,
                              item.companyName,
                              item.date,
                              item.uid,
                              item.address,
                              item.client,
                              item.contactNumber
                            )}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{item.isUpdated ? 'Edit Update' : 'Update'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block">Address</span>
                          <p className="text-slate-300 font-medium truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{item.address || 'N/A'}</span>
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block">Client / Contact</span>
                          <p className="text-slate-300 font-medium truncate flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{item.client || 'N/A'} ({item.contactNumber || 'N/A'})</span>
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block">Next Follow Up Date</span>
                          <p className="text-sky-300 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{item.nextFollowUpDate || 'Pending'}</span>
                          </p>
                        </div>
                      </div>

                      {item.remarks && (
                        <div className="pt-1 text-xs text-slate-400 italic bg-slate-900/50 p-2 rounded-xl">
                          <strong>Remarks:</strong> "{item.remarks}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Evening Follow Up Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full text-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Moon className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-lg text-white">Update Evening Follow Up</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Data entered below will be saved directly into Google Sheet tab <strong className="text-amber-400 font-semibold">'Evening Follow Up'</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Uid & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Uid (ID)</label>
                    <input
                      type="text"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Date (DD-MM-YYYY)</label>
                    <input
                      type="date"
                      value={convertDDMMYYYYToInputDate(reportDate)}
                      onChange={(e) => setReportDate(convertInputDateToDDMMYYYY(e.target.value))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      required
                    />
                  </div>
                </div>

                {/* 2. Sales Person Name & Company Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Sales Person Name</label>
                    <input
                      type="text"
                      value={salesPersonName}
                      onChange={(e) => setSalesPersonName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Company Name</label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      placeholder="e.g. Reliance Retail Logistics"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* 3. Address & Client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 44, MIDC Industrial Area"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Client (Contact Person)</label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="e.g. Rajesh Mehta"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* 4. Contact Number & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. +91 98201 12345"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Purchase Manager"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* 5. Remarks */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Enter meeting discussion outcome, feedback, or follow-up notes..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                {/* 6. Next Follow Up Date */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Next Follow Up Date (DD-MM-YYYY)</label>
                  <input
                    type="date"
                    value={convertDDMMYYYYToInputDate(nextFollowUpDate)}
                    onChange={(e) => setNextFollowUpDate(convertInputDateToDDMMYYYY(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-semibold"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to 'Evening Follow Up' Google Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Save Evening Follow Up</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
