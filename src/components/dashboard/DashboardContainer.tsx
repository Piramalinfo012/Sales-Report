import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { AdminDashboard } from './AdminDashboard';
import { SalesDashboard } from './SalesDashboard';
import { TargetModule } from '../modules/TargetModule';
import { MorningPlanModule } from '../modules/MorningPlanModule';
import { EveningReportModule } from '../modules/EveningReportModule';
import { GPSTrackingModule } from '../modules/GPSTrackingModule';
import { CustomersModule } from '../modules/CustomersModule';
import { ReportsModule } from '../modules/ReportsModule';
import { AnalyticsModule } from '../modules/AnalyticsModule';
import { UserProfileModule } from '../modules/UserProfileModule';
import { SettingsModule } from '../modules/SettingsModule';
import { ReferencesModule } from '../modules/ReferencesModule';
import { SalesAutoTracker } from './SalesAutoTracker';

export type NavigationTab =
  | 'dashboard'
  | 'target'
  | 'morning_plan'
  | 'evening_report'
  | 'gps_tracking'
  | 'customers'
  | 'references'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'profile';

export const DashboardContainer: React.FC = () => {
  const { authState } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  const role = authState.user?.role;

  if (role === 'Sales') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white relative">
         <SalesAutoTracker />
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'dashboard':
        return role === 'Admin' ? (
          <AdminDashboard onNavigate={setCurrentTab} />
        ) : (
          <SalesDashboard onNavigate={setCurrentTab} />
        );
      case 'target':
        return <TargetModule />;
      case 'morning_plan':
        return <MorningPlanModule />;
      case 'evening_report':
        return <EveningReportModule />;
      case 'gps_tracking':
        return <GPSTrackingModule />;
      case 'customers':
        return <CustomersModule />;
      case 'reports':
        return <ReportsModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'settings':
        return <SettingsModule />;
      case 'profile':
        return <UserProfileModule />;
      case 'references':
        return <ReferencesModule />;
      default:
        return role === 'Admin' ? (
          <AdminDashboard onNavigate={setCurrentTab} />
        ) : (
          <SalesDashboard onNavigate={setCurrentTab} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-sky-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isOpenMobileSidebar}
        closeMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          toggleSidebarMobile={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};


