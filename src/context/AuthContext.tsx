import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, ToastMessage, MorningPlan, EveningReport, GPSRecord, GPSExcelRecord, AttendanceRecord, Customer, ReferenceRecord, LeaveRecord } from '../types';
import { loginWithGoogleSheet, saveGPSToSheet, fetchGPSDataFromSheet, fetchReferencesFromSheet, fetchLeavesFromSheet } from '../services/api';

interface AuthContextType {
  authState: AuthState;
  login: (id: string, pass: string, rememberMe: boolean) => Promise<User>;
  logout: () => void;
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  // Theme Mode
  themeMode: 'dark' | 'light';
  toggleTheme: () => void;
  // Data States
  morningPlans: MorningPlan[];
  addMorningPlan: (plan: MorningPlan) => void;
  eveningReports: EveningReport[];
  addEveningReport: (report: EveningReport) => void;
  gpsRecords: GPSRecord[];
  addGPSRecord: (record: GPSRecord) => void;
  gpsExcelRecords: GPSExcelRecord[];
  addGPSExcelRecords: (recs: GPSExcelRecord[]) => void;
  clearGPSExcelRecords: () => void;
  refreshGPSData: () => Promise<boolean>;
  captureGPSLocation: (actionSource?: string) => Promise<GPSRecord | null>;
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (rec: AttendanceRecord) => void;
  customers: Customer[];
  addCustomer: (cust: Customer) => void;
  references: ReferenceRecord[];
  addReference: (ref: ReferenceRecord) => void;
  refreshReferences: () => Promise<void>;
  leaveRecords: LeaveRecord[];
  refreshLeaves: () => Promise<void>;
}

const LOCAL_STORAGE_USER_KEY = 'sales_reporting_user';
const LOCAL_STORAGE_REMEMBER_KEY = 'sales_reporting_remember_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Known demo/sample record IDs. These are purged from any previously cached
// localStorage so the system shows ONLY real data from the connected source.
const DEMO_RECORD_IDS = new Set<string>([
  'MP-101', 'MP-102',
  'ER-201',
  'GPS-01', 'GPS-02',
  'ATT-101', 'ATT-102',
  'CUST-001', 'CUST-002',
  'REF-101', 'REF-102',
]);

// Load a persisted array from localStorage, dropping any leftover demo records
// while preserving real user-entered data.
function loadStoredRecords<T extends { id?: string }>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: T) => item && item.id && !DEMO_RECORD_IDS.has(item.id));
  } catch {
    return [];
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme Mode State ('dark' or 'light')
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('sales_theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('sales_theme', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Persistent modules data state (real data only — demo records are purged)
  const [morningPlans, setMorningPlans] = useState<MorningPlan[]>(() => {
    const stored = loadStoredRecords<MorningPlan>('sales_morning_plans');
    const map = new Map<string, MorningPlan>();
    stored.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  });

  const [eveningReports, setEveningReports] = useState<EveningReport[]>(() =>
    loadStoredRecords<EveningReport>('sales_evening_reports')
  );

  const [gpsRecords, setGpsRecords] = useState<GPSRecord[]>(() =>
    loadStoredRecords<GPSRecord>('sales_gps_records')
  );

  const [gpsExcelRecords, setGpsExcelRecords] = useState<GPSExcelRecord[]>(() =>
    loadStoredRecords<GPSExcelRecord>('sales_gps_excel_records')
  );

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    loadStoredRecords<AttendanceRecord>('sales_attendance')
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStoredRecords<Customer>('sales_customers')
  );

  const [references, setReferences] = useState<ReferenceRecord[]>(() =>
    loadStoredRecords<ReferenceRecord>('sales_references')
  );

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() =>
    loadStoredRecords<LeaveRecord>('sales_leaves')
  );

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('sales_morning_plans', JSON.stringify(morningPlans));
  }, [morningPlans]);

  useEffect(() => {
    localStorage.setItem('sales_evening_reports', JSON.stringify(eveningReports));
  }, [eveningReports]);

  useEffect(() => {
    localStorage.setItem('sales_gps_records', JSON.stringify(gpsRecords));
  }, [gpsRecords]);

  useEffect(() => {
    localStorage.setItem('sales_gps_excel_records', JSON.stringify(gpsExcelRecords));
  }, [gpsExcelRecords]);

  useEffect(() => {
    localStorage.setItem('sales_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('sales_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('sales_references', JSON.stringify(references));
  }, [references]);

  useEffect(() => {
    localStorage.setItem('sales_leaves', JSON.stringify(leaveRecords));
  }, [leaveRecords]);

  // Read saved user on load
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUserStr) {
        const savedUser: User = JSON.parse(savedUserStr);
        setAuthState({
          user: savedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const login = async (id: string, pass: string, rememberMe: boolean): Promise<User> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await loginWithGoogleSheet(id, pass);

      // Save user in LocalStorage as specified in requirements
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      localStorage.setItem('ID', user.id);
      localStorage.setItem('User Name', user.userName);
      localStorage.setItem('Role', user.role);
      localStorage.setItem('Manager', user.manager);
      localStorage.setItem('Profile URL', user.profileUrl);

      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_REMEMBER_KEY, id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_REMEMBER_KEY);
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      showToast('success', 'Login Successful', `Welcome back, ${user.userName}!`);
      return user;
    } catch (err: any) {
      const errorMsg = err.message || 'Invalid ID or Password.';
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMsg,
      });
      showToast('error', 'Login Failed', errorMsg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem('ID');
    localStorage.removeItem('User Name');
    localStorage.removeItem('Role');
    localStorage.removeItem('Manager');
    localStorage.removeItem('Profile URL');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    showToast('info', 'Logged Out', 'You have been securely signed out.');
  };

  const addMorningPlan = (plan: MorningPlan) => {
    if (!plan || !plan.id) return;
    setMorningPlans(prev => {
      const index = prev.findIndex(p => p.id === plan.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = { ...copy[index], ...plan };
        return copy;
      }
      return [plan, ...prev];
    });
  };

  const addEveningReport = (report: EveningReport) => {
    setEveningReports(prev => [report, ...prev]);
  };

  const addGPSRecord = (record: GPSRecord) => {
    setGpsRecords(prev => [record, ...prev]);
  };

  const addGPSExcelRecords = (recs: GPSExcelRecord[]) => {
    setGpsExcelRecords(prev => [...recs, ...prev]);
  };

  const clearGPSExcelRecords = async () => {
    setGpsExcelRecords([]);
    try {
      const params = new URLSearchParams();
      params.append('sheetName', 'GPS');
      params.append('action', 'clear');
      await fetch('https://script.google.com/macros/s/AKfycbyhXWGagj_RY-JEkrNaKA2aNjiSlAOJDEYau6Hm7tCfQ4t7Y03aGZBhgkPWfJrslFrdZg/exec', {
        method: 'POST',
        body: params,
      });
    } catch (err) {
      console.error('Error clearing sheet:', err);
    }
  };

  const refreshGPSData = async (): Promise<boolean> => {
    try {
      const { liveRecords, excelRecords } = await fetchGPSDataFromSheet();
      if (liveRecords.length > 0) {
        setGpsRecords(prev => {
          const map = new Map<string, GPSRecord>();
          liveRecords.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
      if (excelRecords.length > 0) {
        setGpsExcelRecords(prev => {
          const map = new Map<string, GPSExcelRecord>();
          excelRecords.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
      return true;
    } catch (err) {
      console.warn('Error refreshing GPS data:', err);
      return false;
    }
  };

  const addAttendanceRecord = (rec: AttendanceRecord) => {
    setAttendanceRecords(prev => [rec, ...prev]);
  };

  const addCustomer = (cust: Customer) => {
    setCustomers(prev => [cust, ...prev]);
  };

  const addReference = (ref: ReferenceRecord) => {
    setReferences(prev => [ref, ...prev]);
  };

  const refreshReferences = async () => {
    try {
      const remoteRefs = await fetchReferencesFromSheet();
      if (remoteRefs && remoteRefs.length > 0) {
        setReferences(prev => {
          const map = new Map<string, ReferenceRecord>();
          remoteRefs.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Error fetching references from sheet:', err);
    }
  };

  const refreshLeaves = async () => {
    try {
      const remoteLeaves = await fetchLeavesFromSheet();
      if (remoteLeaves && remoteLeaves.length > 0) {
        setLeaveRecords(prev => {
          const map = new Map<string, LeaveRecord>();
          remoteLeaves.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Error fetching leave records from sheet:', err);
    }
  };

  const captureGPSLocation = async (actionSource = 'Manual Check-in'): Promise<GPSRecord | null> => {
    if (!authState.user) return null;

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showToast('warning', 'GPS Unavailable', 'Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const dateStr = new Date().toISOString().split('T')[0];
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const rec: GPSRecord = {
            id: 'GPS-' + Date.now(),
            salesPersonId: authState.user!.id,
            salesPersonName: authState.user!.userName,
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)} (Captured)`,
            date: dateStr,
            time: timeStr,
            accuracy: Math.round(accuracy),
            actionSource,
          };

          addGPSRecord(rec);
          await saveGPSToSheet(rec);
          showToast('success', 'GPS Location Captured', `Lat ${latitude.toFixed(4)}, Long ${longitude.toFixed(4)} logged.`);
          resolve(rec);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          showToast('warning', 'GPS Location Notice', 'Could not get high-accuracy position. Defaulting to last known area.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        toasts,
        showToast,
        removeToast,
        themeMode,
        toggleTheme,
        morningPlans,
        addMorningPlan,
        eveningReports,
        addEveningReport,
        gpsRecords,
        addGPSRecord,
        gpsExcelRecords,
        addGPSExcelRecords,
        clearGPSExcelRecords,
        refreshGPSData,
        captureGPSLocation,
        attendanceRecords,
        addAttendanceRecord,
        customers,
        addCustomer,
        references,
        addReference,
        refreshReferences,
        leaveRecords,
        refreshLeaves,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
