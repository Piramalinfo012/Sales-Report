import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, ToastMessage, MorningPlan, EveningReport, GPSRecord, GPSExcelRecord, AttendanceRecord, Customer } from '../types';
import { loginWithGoogleSheet, saveGPSToSheet } from '../services/api';
import { getIndianDateString, getIndianDateTimeString, getIndianTimeString } from '../utils/dateUtils';

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
  captureGPSLocation: (actionSource?: string) => Promise<GPSRecord | null>;
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (rec: AttendanceRecord) => void;
  customers: Customer[];
  addCustomer: (cust: Customer) => void;
}

const LOCAL_STORAGE_USER_KEY = 'sales_reporting_user';
const LOCAL_STORAGE_REMEMBER_KEY = 'sales_reporting_remember_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const todayDDMMYYYY = getIndianDateString();
const nowISTDateTime = getIndianDateTimeString();

// Initial sample seed data for demo/dashboard views
const INITIAL_MORNING_PLANS: MorningPlan[] = [
  {
    id: 'MP-101',
    salesPersonId: 'SALES01',
    salesPersonName: 'Vikram Sharma',
    meetingDate: todayDDMMYYYY,
    partyName: 'Reliance Retail Logistics',
    contactPerson: 'Suresh Menon',
    mobileNumber: '+91 98201 12345',
    city: 'Mumbai',
    purpose: 'Quarterly Contract Renewal & Heavy Machinery Lubricants',
    expectedBusiness: 450000,
    priority: 'High',
    remarks: 'Key client, high priority meeting',
    status: 'Submitted',
    createdAt: nowISTDateTime,
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
  },
  {
    id: 'MP-102',
    salesPersonId: 'SALES01',
    salesPersonName: 'Vikram Sharma',
    meetingDate: todayDDMMYYYY,
    partyName: 'Tata Motors Ancillary',
    contactPerson: 'Ramesh Patil',
    mobileNumber: '+91 98902 54321',
    city: 'Pune',
    purpose: 'New Product Demo - Hydraulic Oils',
    expectedBusiness: 250000,
    priority: 'Medium',
    remarks: 'Demo required with technical engineer',
    status: 'Pending',
    createdAt: nowISTDateTime,
    latitude: 18.5204,
    longitude: 73.8567,
    address: 'Chinchwad Industrial Area, Pune, Maharashtra 411019',
  },
];

const INITIAL_EVENING_REPORTS: EveningReport[] = [
  {
    id: 'ER-201',
    morningPlanId: 'MP-101',
    salesPersonId: 'SALES01',
    salesPersonName: 'Vikram Sharma',
    partyName: 'Reliance Retail Logistics',
    visited: 'Yes',
    meetingTime: '11:30 AM',
    discussion: 'Presented bulk pricing for Q3. Client requested 5% additional discount for payment within 15 days.',
    productsDiscussed: 'Industrial Synth-Oil 400, Gear Oils',
    requirement: 'Quote for 50 drums by Friday',
    followUpDate: getIndianDateString(new Date(Date.now() + 86400000 * 3)),
    expectedOrder: 420000,
    orderProbability: 85,
    remarks: 'Positive response from VP Procurement',
    photoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'BKC Tower 2, Mumbai',
    status: 'Completed',
    submittedAt: nowISTDateTime,
  }
];

const INITIAL_GPS_RECORDS: GPSRecord[] = [
  {
    id: 'GPS-01',
    salesPersonId: 'SALES01',
    salesPersonName: 'Vikram Sharma',
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    date: todayDDMMYYYY,
    time: '10:15 AM',
    accuracy: 12,
    actionSource: 'Morning Plan Check-in',
  },
  {
    id: 'GPS-02',
    salesPersonId: 'SALES02',
    salesPersonName: 'Ananya Roy',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Connaught Place, New Delhi 110001',
    date: todayDDMMYYYY,
    time: '11:00 AM',
    accuracy: 8,
    actionSource: 'Attendance Check-in',
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'ATT-101',
    salesPersonId: 'SALES01',
    salesPersonName: 'Vikram Sharma',
    date: todayDDMMYYYY,
    punchInTime: '09:15 AM',
    punchInLocation: 'Bandra BKC, Mumbai',
    status: 'Present',
  },
  {
    id: 'ATT-102',
    salesPersonId: 'SALES02',
    salesPersonName: 'Ananya Roy',
    date: todayDDMMYYYY,
    punchInTime: '09:05 AM',
    punchInLocation: 'CP, New Delhi',
    status: 'Present',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    partyName: 'Reliance Retail Logistics',
    contactPerson: 'Suresh Menon',
    mobileNumber: '+91 98201 12345',
    city: 'Mumbai',
    crmId: 'CRM-MUM-99',
    totalOrders: 1250000,
    lastVisitDate: todayDDMMYYYY,
  },
  {
    id: 'CUST-002',
    partyName: 'Tata Motors Ancillary',
    contactPerson: 'Ramesh Patil',
    mobileNumber: '+91 98902 54321',
    city: 'Pune',
    crmId: 'CRM-PUN-44',
    totalOrders: 850000,
    lastVisitDate: '2026-07-15',
  },
];

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

  // Persistent modules data state
  const [morningPlans, setMorningPlans] = useState<MorningPlan[]>(() => {
    const saved = localStorage.getItem('sales_morning_plans');
    const parsed: MorningPlan[] = saved ? JSON.parse(saved) : INITIAL_MORNING_PLANS;
    const map = new Map<string, MorningPlan>();
    parsed.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  });

  const [eveningReports, setEveningReports] = useState<EveningReport[]>(() => {
    const saved = localStorage.getItem('sales_evening_reports');
    return saved ? JSON.parse(saved) : INITIAL_EVENING_REPORTS;
  });

  const [gpsRecords, setGpsRecords] = useState<GPSRecord[]>(() => {
    const saved = localStorage.getItem('sales_gps_records');
    return saved ? JSON.parse(saved) : INITIAL_GPS_RECORDS;
  });

  const [gpsExcelRecords, setGpsExcelRecords] = useState<GPSExcelRecord[]>(() => {
    const saved = localStorage.getItem('sales_gps_excel_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('sales_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('sales_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

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

  const addAttendanceRecord = (rec: AttendanceRecord) => {
    setAttendanceRecords(prev => [rec, ...prev]);
  };

  const addCustomer = (cust: Customer) => {
    setCustomers(prev => [cust, ...prev]);
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
        captureGPSLocation,
        attendanceRecords,
        addAttendanceRecord,
        customers,
        addCustomer,
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
