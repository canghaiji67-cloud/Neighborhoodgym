import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  CalendarCheck,
  Trophy,
  ArrowLeftRight,
  Home,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';

const navItems = [
  { path: '/admin/dashboard', label: '统计面板', icon: LayoutDashboard },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/coaches', label: '教练管理', icon: UserCog },
  { path: '/admin/courses', label: '课程管理', icon: BookOpen },
  { path: '/admin/bookings', label: '预约管理', icon: CalendarCheck },
  { path: '/admin/achievements', label: '成就配置', icon: Trophy },
  { path: '/admin/transactions', label: '交易日志', icon: ArrowLeftRight },
  { path: '/admin/homepage', label: '首页管理', icon: Home },
];

export default function AdminLayout() {
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
          <span className="ml-auto text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
            管理端
          </span>
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
          <div className="text-sm text-gray-400 mb-2 truncate">{user?.nickname || '管理员'}</div>
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
