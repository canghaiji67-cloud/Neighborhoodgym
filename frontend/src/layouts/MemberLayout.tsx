import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarCheck,
  Trophy,
  LogOut,
  ChevronLeft,
  Bot,
} from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';

const navItems = [
  { path: '/member/dashboard', label: '会员中心', icon: LayoutDashboard },
  { path: '/member/courses', label: '课程列表', icon: BookOpen },
  { path: '/member/bookings', label: '我的预约', icon: CalendarCheck },
  { path: '/member/coaches', label: '教练列表', icon: Users },
  { path: '/member/checkin', label: '健身打卡', icon: CalendarCheck },
  { path: '/member/achievements', label: '成就徽章', icon: Trophy },
  { path: '/member/ai-assistant', label: 'AI 助手', icon: Bot },
];

export default function MemberLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-800">
          <Dumbbell className="w-6 h-6 text-primary-400" />
          <span className="text-white font-bold text-lg">GymChain</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400 border-l-[3px] border-primary-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2 truncate">{user?.nickname || '会员'}</div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              首页
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 ml-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-100 overflow-auto">
        <div className="px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
