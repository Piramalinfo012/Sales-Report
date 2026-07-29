import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getIndianDateString } from '../../utils/dateUtils';
import { FileSpreadsheet, Download, Filter, FileText, FileCode, Search, Calendar, User, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const ReportsModule: React.FC = () => {
  const { morningPlans, eveningReports, showToast } = useAuth();

  // Filters
  const [reportType, setReportType] = useState('Daily');
  const [salesPersonFilter, setSalesPersonFilter] = useState('All');
  const [managerFilter, setManagerFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Collect unique filter choices
  const salesPersons = Array.from(new Set(morningPlans.map(p => p.salesPersonName)));
  const cities = Array.from(new Set(morningPlans.map(p => p.city)));

  // Combine reports and morning plans for report view
  const combinedData = morningPlans.map(plan => {
    const report = eveningReports.find(r => r.morningPlanId === plan.id || r.partyName === plan.partyName);
    return {
      planId: plan.id,
      salesPerson: plan.salesPersonName,
      meetingDate: getIndianDateString(plan.meetingDate),
      partyName: plan.partyName,
      contactPerson: plan.contactPerson,
      city: plan.city,
      expectedBusiness: plan.expectedBusiness,
      priority: plan.priority,
      visited: report ? report.visited : 'Pending',
      actualOrder: report ? report.expectedOrder : 0,
      probability: report ? `${report.orderProbability}%` : 'N/A',
      discussion: report ? report.discussion : plan.purpose,
    };
  });

  // ===== Visit Calendar =====
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const pad2 = (n: number) => String(n).padStart(2, '0');

  const [calendarMonthDate, setCalendarMonthDate] = useState(() => new Date());
  const [calendarSalesPerson, setCalendarSalesPerson] = useState('All');

  const goToPrevMonth = () => setCalendarMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCalendarMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToCurrentMonth = () => setCalendarMonthDate(new Date());

  // Plan & Actual visit counts per day (key: DD-MM-YYYY), for the selected sales person
  const calendarCounts = useMemo(() => {
    const map = new Map<string, { plan: number; actual: number }>();
    combinedData.forEach(item => {
      if (calendarSalesPerson !== 'All' && item.salesPerson !== calendarSalesPerson) return;
      if (!map.has(item.meetingDate)) map.set(item.meetingDate, { plan: 0, actual: 0 });
      const entry = map.get(item.meetingDate)!;
      entry.plan += 1;
      if (item.visited === 'Yes') entry.actual += 1;
    });
    return map;
  }, [combinedData, calendarSalesPerson]);

  // Grid cells for the currently viewed month (padded to full weeks)
  const calendarGrid = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const todayKey = getIndianDateString();

    const cells: Array<{ day: number; inCurrentMonth: boolean; dateKey?: string; isToday?: boolean }> = [];

    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, inCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${pad2(d)}-${pad2(month + 1)}-${year}`;
      cells.push({ day: d, inCurrentMonth: true, dateKey, isToday: dateKey === todayKey });
    }
    let trailDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: trailDay++, inCurrentMonth: false });
    }

    return cells;
  }, [calendarMonthDate]);

  // Filtered dataset
  const filteredData = combinedData.filter(item => {
    if (salesPersonFilter !== 'All' && item.salesPerson !== salesPersonFilter) return false;
    if (cityFilter !== 'All' && item.city !== cityFilter) return false;
    if (statusFilter !== 'All' && item.visited !== statusFilter) return false;
    return true;
  });

  // Export handlers
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Plan ID', 'Sales Rep', 'Meeting Date', 'Party Name', 'City', 'Expected Business', 'Visited Status', 'Actual Order', 'Discussion'];
    const rows = filteredData.map(d => [
      d.planId,
      `"${d.salesPerson}"`,
      d.meetingDate,
      `"${d.partyName}"`,
      `"${d.city}"`,
      d.expectedBusiness,
      d.visited,
      d.actualOrder,
      `"${d.discussion.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Daily_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', 'Sales report downloaded successfully.');
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Daily Report');
    XLSX.writeFile(workbook, `Sales_Daily_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Excel Exported', 'Excel workbook downloaded successfully.');
  };

  const exportToPDF = () => {
    if (filteredData.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sales Daily Reporting System - Master Log', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    let y = 38;
    filteredData.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.partyName} (${item.city}) - ${item.salesPerson}`, 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${item.meetingDate} | Expected: Rs.${item.expectedBusiness} | Visited: ${item.visited}`, 14, y);
      y += 5;
      doc.text(`Discussion: ${item.discussion.substring(0, 80)}...`, 14, y);
      y += 8;
    });

    doc.save(`Sales_Daily_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('success', 'PDF Exported', 'PDF document created and downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-blue-800/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-950/40">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sales Reporting & Export Engine</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate Daily, Weekly & Monthly filtered reports and summaries
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Export as PDF Document"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Export as Excel File"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-600 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Export as CSV File"
          >
            <FileCode className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Report Period</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
          >
            <option value="Daily">Daily Report</option>
            <option value="Weekly">Weekly Report</option>
            <option value="Monthly">Monthly Report</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Sales Person</label>
          <select
            value={salesPersonFilter}
            onChange={(e) => setSalesPersonFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
          >
            <option value="All">All Representatives</option>
            {salesPersons.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">City</label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
          >
            <option value="All">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Visit Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Yes">Visited</option>
            <option value="No">Not Visited</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Visit Calendar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-950/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Visit Calendar</h2>
              <p className="text-xs text-slate-400 mt-0.5">Planned vs Actual client visits, day by day</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={calendarSalesPerson}
              onChange={(e) => setCalendarSalesPerson(e.target.value)}
              className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Sales Reps</option>
              {salesPersons.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {MONTH_NAMES[calendarMonthDate.getMonth()]} {calendarMonthDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span>Plan</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Actual</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {WEEKDAY_LABELS.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarGrid.map((cell, idx) => {
            const counts = cell.dateKey ? calendarCounts.get(cell.dateKey) : undefined;
            return (
              <div
                key={idx}
                className={`min-h-[4.5rem] sm:min-h-[5.5rem] rounded-xl border p-1.5 sm:p-2 flex flex-col transition-colors ${
                  !cell.inCurrentMonth
                    ? 'bg-slate-950/40 border-slate-800/40'
                    : cell.isToday
                    ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span
                  className={`text-[11px] font-bold ${
                    !cell.inCurrentMonth
                      ? 'text-slate-700'
                      : cell.isToday
                      ? 'text-indigo-300'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.day}
                </span>

                {cell.inCurrentMonth && counts && (counts.plan > 0 || counts.actual > 0) && (
                  <div className="mt-auto space-y-1">
                    {counts.plan > 0 && (
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-1 py-0.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="truncate">Plan {counts.plan}</span>
                      </div>
                    )}
                    {counts.actual > 0 && (
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1 py-0.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">Actual {counts.actual}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Data Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span>Master Sales Log ({filteredData.length} Records)</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Plan ID</th>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Target (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Order Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((d) => (
                <tr key={d.planId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{d.planId}</td>
                  <td className="py-3 px-4 font-semibold text-white">{d.salesPerson}</td>
                  <td className="py-3 px-4">{d.meetingDate}</td>
                  <td className="py-3 px-4">{d.partyName}</td>
                  <td className="py-3 px-4">{d.city}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">
                    ₹{(d.expectedBusiness || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.visited === 'Yes'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {d.visited}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    ₹{(d.actualOrder || 0).toLocaleString('en-IN')}
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
