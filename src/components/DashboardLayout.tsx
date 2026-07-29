import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, FileText,
  CreditCard, Bell, MessageSquare, Settings, Menu, LogOut, ChevronRight,
  ClipboardList, Shield, Bus, Truck, Library, PiggyBank, Timer, PencilLine,
  Archive, Award, Activity, AlertTriangle, Building2, Globe,
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

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'developer', 'teacher', 'student', 'parent', 'superadmin'] },
    ],
  },
  {
    title: 'Super Admin',
    items: [
      { icon: Building2, label: 'Schools', href: '/schools', roles: ['superadmin'] },
      { icon: Globe, label: 'All Announcements', href: '/announcements', roles: ['superadmin'] },
    ],
  },
  {
    title: 'Academics',
    items: [
      { icon: Users, label: 'Students', href: '/students', roles: ['admin', 'developer'] },
      { icon: GraduationCap, label: 'Teachers', href: '/teachers', roles: ['admin', 'developer'] },
      { icon: BookOpen, label: 'Classes', href: '/classes', roles: ['admin', 'developer'] },
      { icon: PencilLine, label: 'Examinations', href: '/examinations', roles: ['admin', 'developer', 'teacher'] },
      { icon: Timer, label: 'Timetables', href: '/timetables', roles: ['admin', 'developer', 'teacher'] },
      { icon: ClipboardList, label: 'Homework', href: '/homework', roles: ['admin', 'developer', 'teacher'] },
      { icon: Calendar, label: 'Attendance', href: '/attendance', roles: ['admin', 'developer'] },
      { icon: FileText, label: 'Grades', href: '/grades', roles: ['admin', 'developer'] },
      { icon: Award, label: 'Scholarships', href: '/scholarships', roles: ['admin', 'developer'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: Library, label: 'Library', href: '/library', roles: ['admin', 'developer'] },
      { icon: Truck, label: 'Inventory', href: '/inventory', roles: ['admin', 'developer'] },
      { icon: Bus, label: 'Transport', href: '/transport', roles: ['admin', 'developer'] },
    ],
  },
  {
    title: 'Finances',
    items: [
      { icon: CreditCard, label: 'Fees', href: '/fees', roles: ['admin', 'developer', 'parent'] },
      { icon: PiggyBank, label: 'Payroll', href: '/payroll', roles: ['admin', 'developer'] },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Shield, label: 'Roles', href: '/roles', roles: ['admin', 'developer'] },
      { icon: Users, label: 'Users', href: '/users', roles: ['admin', 'developer'] },
      { icon: Archive, label: 'Deleted Records', href: '/deleted-records', roles: ['admin', 'developer'] },
      { icon: Activity, label: 'System Logs', href: '/system-logs', roles: ['developer'] },
      { icon: Bell, label: 'Announcements', href: '/announcements', roles: ['admin', 'developer', 'teacher', 'student', 'parent'] },
      { icon: MessageSquare, label: 'Messages', href: '/messages', roles: ['admin', 'developer', 'teacher', 'student', 'parent'] },
      { icon: Settings, label: 'Settings', href: '/settings', roles: ['admin', 'developer', 'teacher'] },
    ],
  },
];

export function DashboardLayout({ children, userRole }: { children: React.ReactNode, userRole: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <div className="flex h-screen bg-neutral-50 font-sans">
      <aside className={cn(
        "bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col overflow-hidden",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">N</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">NexusEdu</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-thin">
          {sidebarSections.map((section) => {
            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {isSidebarOpen && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 px-3 mb-2">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
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
                        {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                        {isActive && isSidebarOpen && <ChevronRight className="ml-auto w-4 h-4" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 flex-shrink-0">
          <button onClick={signOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full text-neutral-600 hover:text-red-600 transition-colors rounded-lg",
              !isSidebarOpen && "justify-center"
            )}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{profile?.name || 'User'}</p>
              <p className="text-xs text-neutral-500 capitalize">{userRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-neutral-500">
              {(profile?.name || 'U').charAt(0)}
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
