import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  Bell,
  Menu,
  X,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';

export const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Fetch latest notifications if authenticated
    if (user) {
      api.get('/admin/announcements')
        .then(res => {
          if (res.success) setAnnouncements(res.data.slice(0, 3));
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 lg:hidden transition-colors"
            aria-label="Toggle navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base lg:text-lg tracking-tight text-white">
                  NextGen<span className="text-gradient">Placement</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Portal
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: AI Provider pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AI Engine:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Hybrid LLM / Resilient Engine Active
          </span>
        </div>

        {/* Right: Role, Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 relative transition-colors"
              title="Campus Announcements"
            >
              <Bell className="w-5 h-5" />
              {announcements.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-panel-glow rounded-xl p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Placement Announcements</span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">No new notices at this time.</p>
                  ) : (
                    announcements.map((a, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{a.title}</div>
                        <div className="text-slate-400 text-[11px] line-clamp-2">{a.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-200 leading-none">{user?.name}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center justify-end gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                    <GraduationCap className="w-3 h-3" /> Student
                  </span>
                )}
              </span>
            </div>

            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="View Profile"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
