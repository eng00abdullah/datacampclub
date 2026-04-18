import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Info, Calendar, BookOpen, Code, 
  FileText, Users, Image as ImageIcon, Mail, 
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight,
  Settings as SettingsIcon, Shield, BarChart3, X, User, Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import Logo from './Logo';

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { demoSettings } from '../lib/demoData';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const { 
    user, 
    profile, 
    isSuperAdmin,
    isAdmin, 
    isHR, 
    isEventManager,
    isContentManager,
    isFinanceManager,
    isOrganizer,
    isManager 
  } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [settings, setSettings] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      // Update global CSS variable for layout spacing
      if (desktop) {
        document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  useEffect(() => {
    if (!isFirebaseReady) {
      setSettings(demoSettings);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    }, (error) => {
      console.warn("Sidebar settings listener error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isFirebaseReady) {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../lib/firebase');
      await signOut(auth);
    }
    window.location.href = '/';
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const mainLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Projects', path: '/projects', icon: Code },
    { name: 'Blog', path: '/blog', icon: FileText },
    { name: 'Staff', path: '/staff', icon: Users },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: BarChart3, visible: isManager },
    { name: 'Users', path: '/admin/users', icon: Users, visible: isAdmin || isHR },
    { name: 'Events', path: '/admin/events', icon: Calendar, visible: isAdmin || isHR || isEventManager },
    { name: 'Staff', path: '/admin/staff', icon: User, visible: isAdmin },
    { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon, visible: isAdmin || isContentManager },
    { name: 'Projects', path: '/admin/projects', icon: Code, visible: isAdmin || isContentManager },
    { name: 'Blog', path: '/admin/blog', icon: FileText, visible: isAdmin || isContentManager },
    { name: 'Messages', path: '/admin/messages', icon: Mail, visible: isAdmin || isContentManager },
    { name: 'Content', path: '/admin/content', icon: LayoutDashboard, visible: isAdmin || isContentManager },
    { name: 'Security', path: '/admin/security', icon: Shield, visible: isSuperAdmin },
    { name: 'Profile', path: '/profile', icon: User, visible: true },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, visible: isSuperAdmin },
  ].filter(link => link.visible);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isDesktop ? (isCollapsed ? '80px' : '280px') : '280px',
          x: isDesktop || isOpen ? 0 : -280,
          visibility: isDesktop || isOpen ? 'visible' : 'hidden'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-screen glass border-r border-white/10 z-50 flex flex-col cyber-grid flex-shrink-0 ${!isDesktop && !isOpen ? 'pointer-events-none' : ''}`}
      >
        {/* Logo Section - Fixed at top */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'} border-b border-white/5`}>
          <Link to="/" className="shrink-0 group" onClick={closeOnMobile}>
            <Logo isCollapsed={isCollapsed && isDesktop} iconSize={32} />
          </Link>
          {/* Mobile Close Button */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto text-muted-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden px-3 py-6 space-y-2 custom-scrollbar">
          <div className="mb-4">
            {(!isCollapsed || !isDesktop) && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-cyber tracking-widest text-muted-foreground px-4 mb-4"
              >
                Navigation
              </motion.p>
            )}
            {mainLinks.map((link, idx) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={link.path}
                  onClick={closeOnMobile}
                  className={`flex items-center ${(isCollapsed && isDesktop) ? 'justify-center' : 'space-x-4 px-4'} py-3 rounded-xl transition-all group relative border-2 ${
                    location.pathname === link.path 
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border-transparent hover:border-white/10'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <link.icon className={`w-5 h-5 shrink-0 ${location.pathname === link.path ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                  </motion.div>
                  {(!isCollapsed || !isDesktop) && <span className="font-cyber text-sm tracking-wider">{link.name}</span>}
                  
                  {/* Active Indicator for Collapsed Mode */}
                  {location.pathname === link.path && (isCollapsed && isDesktop) && (
                    <motion.div layoutId="active-dot" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#39FF14]" />
                  )}
                  
                  {/* Tooltip for Collapsed Mode */}
                  {(isCollapsed && isDesktop) && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-dark-navy border border-white/10 rounded text-[10px] font-cyber tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50">
                      {link.name}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {isManager && (
            <div className="pt-6 border-t border-white/5">
              {(!isCollapsed || !isDesktop) && <p className="text-[10px] font-cyber tracking-widest text-muted-foreground px-4 mb-4">Admin Portal</p>}
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeOnMobile}
                  className={`flex items-center ${(isCollapsed && isDesktop) ? 'justify-center' : 'space-x-4 px-4'} py-3 rounded-xl transition-all group relative border-2 ${
                    (link.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.path)) 
                    ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/30 shadow-[0_0_15px_rgba(188,19,254,0.1)]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border-transparent hover:border-white/10'
                  }`}
                >
                  <link.icon className={`w-5 h-5 shrink-0 ${
                    (link.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.path)) 
                    ? 'text-neon-purple' 
                    : 'group-hover:text-neon-purple transition-colors'
                  }`} />
                  {(!isCollapsed || !isDesktop) && <span className="font-cyber text-sm tracking-wider">{link.name}</span>}
                  
                  {(isCollapsed && isDesktop) && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-dark-navy border border-white/10 rounded text-[10px] font-cyber tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {link.name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {user ? (
            <div className="space-y-2">
              <Link 
                to="/profile"
                onClick={closeOnMobile}
                className={`flex items-center ${(isCollapsed && isDesktop) ? 'justify-center' : 'space-x-3'} p-2 rounded-lg transition-all ${
                  location.pathname === '/profile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{user.email?.[0].toUpperCase()}</span>
                  )}
                </div>
                {(!isCollapsed || !isDesktop) && (
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold truncate">{profile?.fullName || user.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{isManager ? 'Admin' : 'Member'}</p>
                  </div>
                )}
                {(isCollapsed && isDesktop) && (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-dark-navy border border-white/10 rounded text-[10px] font-cyber tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Profile
                  </div>
                )}
              </Link>
              
              {(!isCollapsed || !isDesktop) && (
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center space-x-3 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
                </button>
              )}
            </div>
          ) : (
            <Button 
              variant="cyber" 
              className="w-full" 
              size="sm"
              onClick={() => {
                navigate('/login');
                closeOnMobile();
              }}
            >
              {(!isCollapsed || !isDesktop) ? 'LOGIN_SYSTEM' : <LogOut className="w-4 h-4" />}
            </Button>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
