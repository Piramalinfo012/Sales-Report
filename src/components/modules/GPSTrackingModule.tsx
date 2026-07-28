import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GPSExcelRecord } from '../../types';
import { saveGPSExcelRowsToSheet } from '../../services/api';
import { getIndianDateString } from '../../utils/dateUtils';
import {
  Navigation,
  MapPin,
  ExternalLink,
  Clock,
  Shield,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Loader2,
  X,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

const formatExcelDate = (val: any): string => {
  if (!val) return '-';
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const day = String(jsDate.getDate()).padStart(2, '0');
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const year = jsDate.getFullYear();
      const hours = String(jsDate.getHours()).padStart(2, '0');
      const mins = String(jsDate.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${mins}`;
    }
  }
  return String(val);
};

export const GPSTrackingModule: React.FC = () => {
  const { authState, gpsRecords, captureGPSLocation, gpsExcelRecords, addGPSExcelRecords, refreshGPSData, showToast } = useAuth();
  const user = authState.user;
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<'excel' | 'live'>('excel');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto Refresh GPS Sheet Data on Mount
  useEffect(() => {
    refreshGPSData();
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    const ok = await refreshGPSData();
    setIsRefreshing(false);
    if (ok) {
      showToast('success', 'GPS Refreshed', 'Latest GPS records loaded successfully.');
    } else {
      showToast('info', 'GPS Data Updated', 'GPS records refreshed.');
    }
  };

  // File Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<GPSExcelRecord[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleManualPing = async () => {
    setIsCapturing(true);
    await captureGPSLocation('GPS Tracking Module Ping');
    setIsCapturing(false);
  };

  // Helper to calculate unique signature key for a record to prevent duplicates
  const getRecordKey = (r: GPSExcelRecord): string => {
    const trans = (r.transporterName || '').toLowerCase().trim();
    const rec = (r.recipientCustomerName || '').toLowerCase().trim();
    const veh = (r.vehicleNumber || '').toLowerCase().trim();
    const dev = (r.deviceNumber || '').toLowerCase().trim();
    const resDate = (r.resultDate || '').toLowerCase().trim();
    const addr = (r.address || '').toLowerCase().trim();
    const lat = String(r.latitude || '').trim();
    const lng = String(r.longitude || '').trim();

    return `${trans}|${rec}|${veh}|${dev}|${resDate}|${addr}|${lat}|${lng}`;
  };

  // Trigger File Dialog
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process Excel File Upload with Deduplication
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse sheet into 2D array or json objects
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawRows.length < 2) {
          showToast('error', 'Empty File', 'The uploaded Excel file contains no data rows.');
          return;
        }

        // Row 0 is header
        const headers = (rawRows[0] as string[]).map(h => String(h || '').trim());

        const existingKeys = new Set(gpsExcelRecords.map(getRecordKey));
        const fileKeys = new Set<string>();
        const uniqueRecords: GPSExcelRecord[] = [];
        let dupsCount = 0;

        // Map data rows (starting row 1)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          // Helper to get value by column index or header name search
          const getVal = (colIdx: number, ...possibleHeaders: string[]) => {
            if (row[colIdx] !== undefined && row[colIdx] !== null && String(row[colIdx]).trim() !== '') {
              return String(row[colIdx]).trim();
            }
            for (const ph of possibleHeaders) {
              const hIdx = headers.findIndex(h => h.toLowerCase().includes(ph.toLowerCase()));
              if (hIdx >= 0 && row[hIdx] !== undefined && row[hIdx] !== null) {
                return String(row[hIdx]).trim();
              }
            }
            return '';
          };

          const record: GPSExcelRecord = {
            id: 'GPS-EXCEL-' + Date.now() + '-' + i,
            transporterName: getVal(0, 'transporter'),
            recipientCustomerName: getVal(1, 'recipient', 'customer'),
            vehicleNumber: getVal(2, 'vehicle'),
            resourceName: getVal(3, 'resource'),
            deviceNumber: getVal(4, 'device'),
            resultDate: getVal(5, 'result date', 'date'),
            address: getVal(6, 'address', 'location'),
            latitude: getVal(7, 'latitude', 'lat'),
            longitude: getVal(8, 'longitude', 'long', 'lng'),
            accuracy: getVal(9, 'accuracy'),
            distance: getVal(10, 'distance'),
            status: getVal(11, 'status'),
            type: getVal(12, 'type'),
            uploadedAt: getIndianDateString(),
          };

          // Check if record is valid and non-duplicate
          if (record.transporterName || record.recipientCustomerName || record.vehicleNumber || record.address || record.latitude) {
            const key = getRecordKey(record);
            if (existingKeys.has(key) || fileKeys.has(key)) {
              dupsCount++;
            } else {
              fileKeys.add(key);
              uniqueRecords.push(record);
            }
          }
        }

        setSkippedDuplicates(dupsCount);

        if (uniqueRecords.length === 0) {
          if (dupsCount > 0) {
            showToast('warning', 'All Duplicates', `All ${dupsCount} row(s) in this file already exist in the system and were skipped.`);
          } else {
            showToast('warning', 'No Valid Data', 'Could not parse valid GPS rows from file.');
          }
          return;
        }

        if (dupsCount > 0) {
          showToast('info', 'Duplicates Removed', `${dupsCount} duplicate row(s) skipped. ${uniqueRecords.length} new unique rows ready.`);
        }

        setParsedRows(uniqueRecords);
        setShowPreviewModal(true);
      } catch (err: any) {
        console.error('File parsing error:', err);
        showToast('error', 'Parse Error', 'Could not parse Excel file. Please use valid .xlsx or .xls format.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit Parsed Excel rows to Google Sheet 'GPS' tab
  const handleConfirmUpload = async () => {
    if (parsedRows.length === 0) return;

    setIsUploading(true);

    try {
      const success = await saveGPSExcelRowsToSheet(parsedRows);

      // Save locally to context state as well
      addGPSExcelRecords(parsedRows);

      if (success) {
        showToast('success', 'GPS File Uploaded', `${parsedRows.length} GPS rows successfully stored.`);
      } else {
        showToast('info', 'Saved Locally', `${parsedRows.length} GPS rows saved locally.`);
      }

      setShowPreviewModal(false);
      setParsedRows([]);
      setActiveTab('excel');
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message || 'Could not upload data.');
    } finally {
      setIsUploading(false);
    }
  };

  // Download Sample Excel Template with exact 13 headers
  const handleDownloadSample = () => {
    const sampleHeaders = [
      'Transporter Name',
      'Recipient Customer Name',
      'Vehicle Number',
      'Resource Name',
      'Device Number',
      'Result Date',
      'Address',
      'Latitude',
      'Longitude',
      'Accuracy',
      'Distance',
      'Status',
      'Type'
    ];

    const sampleRow = [
      'Piramal Logistics',
      'Reliance Industries Ltd',
      'MH-04-EK-9821',
      'Ramesh Kumar',
      'DEV-99201',
      '27-07-2026',
      'BKC Bandra, Mumbai 400051',
      '19.0760',
      '72.8777',
      '10',
      '12.5 km',
      'Active',
      'Live Tracking'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([sampleHeaders, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GPS');

    XLSX.writeFile(workbook, 'GPS_Upload_Template.xlsx');
    showToast('info', 'Template Downloaded', 'GPS_Upload_Template.xlsx downloaded with 13 column headers.');
  };

  // Get list of sales persons for filter
  const salesPersons = Array.from(new Set(gpsRecords.map(r => r.salesPersonName)));

  // Filtered Live Records
  const filteredLiveRecords = gpsRecords.filter(r => {
    if (selectedSalesPerson === 'All') return true;
    return r.salesPersonName === selectedSalesPerson;
  });

  // Filtered Excel Records
  const filteredExcelRecords = gpsExcelRecords.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.transporterName || '').toLowerCase().includes(q) ||
      (r.recipientCustomerName || '').toLowerCase().includes(q) ||
      (r.vehicleNumber || '').toLowerCase().includes(q) ||
      (r.resourceName || '').toLowerCase().includes(q) ||
      (r.deviceNumber || '').toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/50 border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Real-Time GPS & Excel Upload</h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload Excel files or capture live pings to record system location data
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold text-xs transition-all disabled:opacity-60 cursor-pointer shadow-md"
            title="Refresh latest GPS data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh GPS Data'}</span>
          </button>

          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
            title="Download sample Excel format"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Sample Excel</span>
          </button>

          <button
            onClick={handleTriggerFileInput}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload GPS Excel File</span>
          </button>

          <button
            onClick={handleManualPing}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <MapPin className={`w-3.5 h-3.5 text-emerald-400 ${isCapturing ? 'animate-spin' : ''}`} />
            <span>{isCapturing ? 'Capturing...' : 'Live Check-in'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'excel'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Uploaded GPS Records ({gpsExcelRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Live Check-in Logs ({gpsRecords.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Excel Uploaded GPS Data View */}
      {activeTab === 'excel' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Transporter, Customer, Vehicle Number, Address, Device, Status..."
              className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder:text-slate-500"
            />
          </div>

          {filteredExcelRecords.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium text-sm">No Excel GPS Records Found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong className="text-emerald-400 font-semibold">'Upload GPS Excel File'</strong> above to select and upload your spreadsheet into the system.
              </p>
              <button
                onClick={handleTriggerFileInput}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel File</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                    <th className="p-3.5 text-center">#</th>
                    <th className="p-3.5 min-w-[130px]">Transporter</th>
                    <th className="p-3.5 min-w-[150px]">Recipient Customer</th>
                    <th className="p-3.5 min-w-[120px]">Vehicle No</th>
                    <th className="p-3.5 min-w-[140px]">Resource Name</th>
                    <th className="p-3.5 min-w-[120px]">Device No</th>
                    <th className="p-3.5 min-w-[130px]">Result Date</th>
                    <th className="p-3.5 min-w-[200px]">Address</th>
                    <th className="p-3.5">Lat</th>
                    <th className="p-3.5">Long</th>
                    <th className="p-3.5">Accuracy</th>
                    <th className="p-3.5">Distance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredExcelRecords.map((item, idx) => {
                    const mapsUrl = item.latitude && item.longitude
                      ? `https://maps.google.com/?q=${item.latitude},${item.longitude}`
                      : null;

                    return (
                      <tr key={`excel-tr-${item.id || idx}`} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-medium text-slate-200">{item.transporterName || '-'}</td>
                        <td className="p-3 text-slate-300">{item.recipientCustomerName || '-'}</td>
                        <td className="p-3 font-bold text-amber-400 whitespace-nowrap">{item.vehicleNumber || '-'}</td>
                        <td className="p-3 text-slate-300">{item.resourceName || '-'}</td>
                        <td className="p-3 font-mono text-sky-400 whitespace-nowrap">{item.deviceNumber || '-'}</td>
                        <td className="p-3 text-slate-300 whitespace-nowrap">{formatExcelDate(item.resultDate)}</td>
                        <td className="p-3 text-slate-300 max-w-[220px] truncate" title={item.address}>{item.address || '-'}</td>
                        <td className="p-3 font-mono text-emerald-400 whitespace-nowrap">{item.latitude || '-'}</td>
                        <td className="p-3 font-mono text-sky-400 whitespace-nowrap">{item.longitude || '-'}</td>
                        <td className="p-3 text-slate-300 whitespace-nowrap">{item.accuracy || '-'}</td>
                        <td className="p-3 text-slate-300 whitespace-nowrap">{item.distance || '-'}</td>
                        <td className="p-3 font-semibold whitespace-nowrap">
                          {item.status ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">
                              {item.status}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300 whitespace-nowrap">{item.type || '-'}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-400 text-[11px] font-semibold transition-colors"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Check-in Logs */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Admin Sales Person Filter */}
          {isAdmin && salesPersons.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <Shield className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-300 font-semibold">Filter Executive:</span>
              <select
                value={selectedSalesPerson}
                onChange={(e) => setSelectedSalesPerson(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="All">All Sales Representatives</option>
                {salesPersons.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            {filteredLiveRecords.map((rec) => {
              const mapsUrl = `https://maps.google.com/?q=${rec.latitude},${rec.longitude}`;

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{rec.salesPersonName}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          ID: {rec.salesPersonId}
                        </span>
                        {rec.actionSource && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                            {rec.actionSource}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Lat: <span className="text-emerald-400">{rec.latitude}</span>, Long: <span className="text-sky-400">{rec.longitude}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{rec.address}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getIndianDateString(rec.date)} at {rec.time}
                        </span>
                        <span>Accuracy: ±{rec.accuracy}m</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold transition-all shrink-0"
                  >
                    <span>View Location Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Excel Upload Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full text-slate-200 shadow-2xl space-y-5 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Excel Upload Preview</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>{uploadFileName}</span>
                      <span className="mx-0.5">•</span>
                      <strong className="text-emerald-400">{parsedRows.length} Unique Rows</strong>
                      {skippedDuplicates > 0 && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800/80 text-[10px] font-semibold">
                          {skippedDuplicates} Duplicates Skipped
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Verify the 13 columns mapped from your file below. Click <strong className="text-emerald-400 font-semibold">'Upload & Save Records'</strong> to store them in the system database.
              </p>

              {/* Preview Table */}
              <div className="flex-1 overflow-auto border border-slate-800 rounded-2xl bg-slate-950/80 custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Transporter</th>
                      <th className="p-3">Recipient Customer</th>
                      <th className="p-3">Vehicle No</th>
                      <th className="p-3">Resource</th>
                      <th className="p-3">Device No</th>
                      <th className="p-3">Result Date</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Lat</th>
                      <th className="p-3">Long</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.map((r, i) => (
                      <tr key={`prow-${i}`} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-slate-500">{i + 1}</td>
                        <td className="p-3 font-medium text-slate-200">{r.transporterName || '-'}</td>
                        <td className="p-3 text-slate-300">{r.recipientCustomerName || '-'}</td>
                        <td className="p-3 font-bold text-amber-400">{r.vehicleNumber || '-'}</td>
                        <td className="p-3 text-slate-300">{r.resourceName || '-'}</td>
                        <td className="p-3 font-mono text-sky-400">{r.deviceNumber || '-'}</td>
                        <td className="p-3 text-slate-300">{r.resultDate || '-'}</td>
                        <td className="p-3 text-slate-300 truncate max-w-[150px]">{r.address || '-'}</td>
                        <td className="p-3 font-mono text-emerald-400">{r.latitude || '-'}</td>
                        <td className="p-3 font-mono text-sky-400">{r.longitude || '-'}</td>
                        <td className="p-3 font-semibold text-emerald-400">{r.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Records...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Upload & Save Records ({parsedRows.length} Rows)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
