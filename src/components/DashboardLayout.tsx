import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  Bell, 
  MessageSquare, 
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../lib/useAuth.tsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'teacher', 'student', 'parent'] },
  // Admin-only
  { icon: Users, label: 'Students', href: '/students', roles: ['admin'] },
  { icon: BookOpen, label: 'Classes', href: '/classes', roles: ['admin'] },
  { icon: CreditCard, label: 'Fees', href: '/fees', roles: ['admin', 'parent'] },
  // Teacher-only
  { icon: ClipboardList, label: 'My Classes', href: '/teacher/classes', roles: ['teacher'] },
  { icon: Calendar, label: 'Attendance', href: '/teacher/attendance', roles: ['teacher'] },
  { icon: GraduationCap, label: 'Grades', href: '/teacher/grades', roles: ['teacher'] },
  { icon: FileText, label: 'Reports', href: '/teacher/reports', roles: ['teacher'] },
  // Shared
  { icon: Bell, label: 'Announcements', href: '/announcements', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: MessageSquare, label: 'Messages', href: '/messages', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['admin', 'teacher'] },
];

export function DashboardLayout({ children, userRole }: { children: React.ReactNode, userRole: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();

  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-neutral-50 font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">N</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">NexusEdu</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                {isActive && isSidebarOpen && <ChevronRight className="ml-auto w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={signOut}
            className={cn(
            "flex items-center gap-3 px-3 py-2 w-full text-neutral-600 hover:text-red-600 transition-colors rounded-lg",
            !isSidebarOpen && "justify-center"
          )}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{localStorage.getItem('userName') || 'User'}</p>
              <p className="text-xs text-neutral-500 capitalize">{userRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-neutral-500">
              {(localStorage.getItem('userName') || 'U').charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
