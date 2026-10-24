import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Mic,
  BrainCircuit,
  Code2,
  Compass,
  Briefcase,
  CalendarCheck2,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Users,
  Building2,
  HelpCircle,
  Megaphone,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isAdmin } = useAuth();

  const studentNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Resume Analyzer', path: '/resume', icon: FileText, badge: 'AI' },
    { name: 'AI Mock Interview', path: '/interview', icon: Mic, badge: 'AI' },
    { name: 'Aptitude Practice', path: '/aptitude', icon: BrainCircuit },
    { name: 'Coding Practice', path: '/coding', icon: Code2 },
    { name: 'Career Guidance', path: '/career', icon: Compass, badge: 'AI' },
    { name: 'Placement Portal', path: '/jobs', icon: Briefcase },
    { name: 'Study Planner', path: '/planner', icon: CalendarCheck2 },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Profile & Settings', path: '/profile', icon: UserCheck }
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert },
    { name: 'Student Directory', path: '/admin/students', icon: Users },
    { name: 'Placement Drives & Jobs', path: '/admin/jobs', icon: Building2 },
    { name: 'Question Bank Manager', path: '/admin/questions', icon: HelpCircle },
    { name: 'Broadcaster Notices', path: '/admin/announcements', icon: Megaphone }
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-35 w-64 glass-panel border-r border-slate-800/80 pt-16 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Student Section */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Student Modules
            </div>
            <nav className="space-y-1">
              {studentNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400">
                <span>Admin Console</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              </div>
              <nav className="space-y-1">
                {adminNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/15 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info card */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-300">
              <span>B.Tech Final Year</span>
              <span className="text-[10px] text-indigo-400">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400">Computer Engineering Placement Portal</p>
          </div>
        </div>
      </aside>
    </>
  );
};
