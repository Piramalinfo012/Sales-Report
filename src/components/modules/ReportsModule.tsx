import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getIndianDateString } from '../../utils/dateUtils';
import { FileSpreadsheet, Download, Filter, FileText, FileCode, Search, Calendar, User, Shield } from 'lucide-react';
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
            className="px-3.5 py-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
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

      {/* Report Data Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
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
