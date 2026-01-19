import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './rbac/context/AuthContext';
import api from './rbac/api/api';
import Login from './rbac/pages/Login';
import AdminLayout from './rbac/pages/AdminLayout';
import ProfilePage from './rbac/pages/ProfilePage';
import UsersPage from './rbac/pages/UsersPage';
import RolesPage from './rbac/pages/RolesPage';
import ProfilesPage from './rbac/pages/ProfilesPage';
import GroupsPage from './rbac/pages/GroupsPage';
import SharingRulesPage from './rbac/pages/SharingRulesPage';
import AuditLogsPage from './rbac/pages/AuditLogsPage';
import SmtpConfigPage from './rbac/pages/SmtpConfigPage';

import { NavigationProvider } from './rbac/context/NavigationContext';


/**
 * ProtectedRoute - Requires authentication
 * Redirects to login if not authenticated.
 */
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/rbac/login" replace />;
  return children;
}

/**
 * LandingRedirect - Redirects authenticated user to their landing page
 * Now relies on AuthContext for landing page data.
 */
function LandingRedirect() {
  const { isAuthenticated, defaultLandingPage, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/rbac/login" replace />;

  return <Navigate to={defaultLandingPage} replace />;
}

/**
 * SettingsIndex - Default Settings page (redirects to first available sub-page)
 */
function SettingsIndex() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Settings</h1>
      <p>Select a section from the sidebar to manage system settings.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public: Login */}
            <Route path="/rbac/login" element={<Login />} />

            {/* Root redirect to /rbac */}
            <Route path="/" element={<Navigate to="/rbac" replace />} />

            {/* RBAC Namespace - Protected */}
            <Route path="/rbac" element={<LandingRedirect />} />

            {/* Profile - Self-service (no admin permission required) */}
            <Route path="/rbac/profile" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ProfilePage />} />
            </Route>

            {/* Settings - Admin module with sub-sections */}
            <Route path="/rbac/settings" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SettingsIndex />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="profiles" element={<ProfilesPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="sharing" element={<SharingRulesPage />} />
              <Route path="smtp" element={<SmtpConfigPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
            </Route>

            {/* Catch-all: Redirect unknown paths to /rbac */}
            <Route path="*" element={<Navigate to="/rbac" replace />} />
          </Routes>
        </BrowserRouter>
      </NavigationProvider>
    </AuthProvider>
  );
}
