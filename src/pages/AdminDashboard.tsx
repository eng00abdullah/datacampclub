import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, Users, Calendar, FileText, Settings, 
  Shield, LogOut, ChevronRight, Search, Bell, Menu, Image as ImageIcon
} from 'lucide-react';
import Overview from './admin/Overview';
import UserManagement from './admin/UserManagement';
import EventManagement from './admin/EventManagement';
import ContentManagement from './admin/ContentManagement';
import StaffManagement from './admin/StaffManagement';
import GalleryManagement from './admin/GalleryManagement';
import BlogManagement from './admin/BlogManagement';
import ProjectManagement from './admin/ProjectManagement';
import MessageManagement from './admin/MessageManagement';
import Security from './admin/Security';
import SettingsPage from './admin/Settings';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ 
  children, 
  allowedRoles, 
  check 
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[],
  check?: boolean
}) => {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (check === false) return <Navigate to="/dashboard" />;
  
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const AdminDashboard = () => {
  const auth = useAuth();

  return (
    <div className="p-4 md:p-8">
      <Routes>
        <Route path="/" element={<Overview />} />
        
        <Route path="/users" element={
          <RoleGuard check={auth.isAdmin || auth.isHR}>
            <UserManagement />
          </RoleGuard>
        } />
        
        <Route path="/events" element={
          <RoleGuard check={auth.isAdmin || auth.isHR || auth.isEventManager}>
            <EventManagement />
          </RoleGuard>
        } />
        
        <Route path="/staff" element={
          <RoleGuard check={auth.isAdmin || auth.isHR}>
            <StaffManagement />
          </RoleGuard>
        } />
        
        <Route path="/gallery" element={
          <RoleGuard check={auth.isManager}>
            <GalleryManagement />
          </RoleGuard>
        } />
        
        <Route path="/content" element={
          <RoleGuard check={auth.isAdmin || auth.isContentManager}>
            <ContentManagement />
          </RoleGuard>
        } />
        
        <Route path="/projects" element={
          <RoleGuard check={auth.isAdmin || auth.isContentManager}>
            <ProjectManagement />
          </RoleGuard>
        } />
        
        <Route path="/blog" element={
          <RoleGuard check={auth.isAdmin || auth.isContentManager}>
            <BlogManagement />
          </RoleGuard>
        } />
        
        <Route path="/messages" element={
          <RoleGuard check={auth.isManager}>
            <MessageManagement />
          </RoleGuard>
        } />
        
        <Route path="/security" element={
          <RoleGuard check={auth.isSuperAdmin}>
            <Security />
          </RoleGuard>
        } />
        
        <Route path="/settings" element={
          <RoleGuard check={auth.isSuperAdmin}>
            <SettingsPage />
          </RoleGuard>
        } />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
