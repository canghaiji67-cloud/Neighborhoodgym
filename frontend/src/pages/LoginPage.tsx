import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Wallet, Loader2, AlertCircle, Shield, Zap, Award } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import useContractStore from '../stores/useContractStore';

const SIGN_MESSAGE_PREFIX =
  'Welcome to GymChain! Sign this message to verify your identity.\n\nNonce: ';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { connectWallet, getNonce, login } = useAuthStore();
  const { initProvider } = useContractStore();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Connect wallet
      const address = await connectWallet();
      if (!address) throw new Error('未获取到钱包地址');

      // 2. Get nonce from backend
      const nonce = await getNonce(address);

      // 3. Sign message with MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const message = SIGN_MESSAGE_PREFIX + nonce;
      const signature = await signer.signMessage(message);

      // 4. Login
      const result = await login(address, signature);

      // 5. Init contract instances
      try {
        await initProvider();
      } catch {
        // contracts may not be deployed yet, non-blocking
      }

      // 6. Navigate
      if (result.needRegister) {
        navigate('/register', { state: { walletAddress: address } });
      } else {
        const user = useAuthStore.getState().user;
        navigate(user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '登录失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes particle-float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(40px); opacity: 0; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out both; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-particle { animation: particle-float linear infinite; }
      `}</style>

      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url('http://localhost:3001/public/homepage-bg.jpg')` }}
      />
      <div className="absolute inset-0 -z-10 bg-black/60" />

      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary-400/20 animate-particle"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            bottom: '-10px',
            animationDuration: `${Math.random() * 8 + 6}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <div className="w-full max-w-lg">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-10 text-center shadow-2xl animate-fade-in-up">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-primary-500/40 animate-pulse-ring" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-float">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
            连接钱包登录
          </h1>
          <p className="text-white/70 text-sm mb-8">
            使用 MetaMask 钱包签名验证身份，安全快捷
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl p-4 mb-6 text-left animate-fade-in-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="relative w-full bg-primary-500 hover:bg-primary-400 disabled:bg-primary-500/50 text-white rounded-xl px-6 py-4 font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 animate-shimmer" />
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  连接中...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  使用 MetaMask 登录
                </>
              )}
            </span>
          </button>

          <p className="text-xs text-white/40 mt-6">
            首次登录将自动引导您完成注册
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: <Shield className="w-6 h-6 text-primary-400" />, title: '区块链验证', desc: '去中心化身份' },
            { icon: <Zap className="w-6 h-6 text-amber-400" />, title: 'FIT 代币', desc: '运动即挖矿' },
            { icon: <Award className="w-6 h-6 text-emerald-400" />, title: 'NFT 成就', desc: '专属健身徽章' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-center hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all animate-fade-in-up"
              style={{ animationDelay: `${0.3 + i * 0.15}s` }}
            >
              <div className="mx-auto mb-2 w-fit">{item.icon}</div>
              <p className="text-xs text-white/70 font-medium">{item.title}</p>
              <p className="text-xs text-white/40 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
