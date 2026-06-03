import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LogIn, LogOut, User, Shield } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';

export default function PublicLayout() {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Top Navbar */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Dumbbell className="w-7 h-7 text-primary-400" />
            <span>GymChain</span>
          </Link>

          <div className="flex items-center gap-4">
            {token && user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'}
                  className="flex items-center gap-1.5 text-sm text-white/80 hover:text-primary-400"
                >
                  {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {user.nickname || '用户'}
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                连接钱包登录
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-black/60 backdrop-blur-md border-t border-white/10 text-white/50 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold">GymChain</span>
          </div>
          <p className="text-sm">区块链驱动的智能健身房管理系统</p>
          <p className="text-xs mt-2">© 2024 GymChain. 毕业设计项目</p>
        </div>
      </footer>
    </div>
  );
}
