import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import G09_DashboardPage from './pages/DashboardPage';
import G09_FreelancersPage from './pages/FreelancersPage';
import G09_ClientsPage from './pages/ClientsPage';
import G09_SkillsPage from './pages/SkillsPage';
import G09_UsagePage from './pages/UsagePage';
import G09_AlertsPage from './pages/AlertsPage';
import G09_ReportsPage from './pages/ReportsPage';
import G09_AuditPage from './pages/AuditPage';
import G09_SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<G09_DashboardPage />} />
        <Route path="/freelancers" element={<G09_FreelancersPage />} />
        <Route path="/clients" element={<G09_ClientsPage />} />
        <Route path="/skills" element={<G09_SkillsPage />} />
        <Route path="/usage" element={<G09_UsagePage />} />
        <Route path="/alerts" element={<G09_AlertsPage />} />
        <Route path="/reports" element={<G09_ReportsPage />} />
        <Route path="/audit" element={<G09_AuditPage />} />
        <Route path="/settings" element={<G09_SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
