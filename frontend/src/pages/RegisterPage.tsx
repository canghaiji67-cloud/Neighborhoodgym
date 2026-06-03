import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import useContractStore from '../stores/useContractStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const walletAddress = (location.state as any)?.walletAddress || useAuthStore.getState().walletAddress || '';

  const { register } = useAuthStore();
  const { initProvider, contracts } = useContractStore();

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'chain'>('form');

  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!walletAddress) {
      setError('钱包地址丢失，请重新登录');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Step 1: On-chain registration via MembershipManager.register()
      setStep('chain');
      let txHash = '';

      try {
        // Direct MetaMask call bypassing ethers.js
        const { CONTRACT_ADDRESSES } = await import('../utils/contractAddresses');
        const hash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: CONTRACT_ADDRESSES.MembershipManager,
            data: '0x1aa3a008',
            gas: '0x30d40',
            gasPrice: '0x3B9ACA00',
          }],
        });
        console.log('[Register] TX hash:', hash);
        // Wait for receipt
        let receipt = null;
        for (let i = 0; i < 30; i++) {
          receipt = await (window as any).ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });
          if (receipt) break;
          await new Promise(r => setTimeout(r, 1000));
        }
        console.log('[Register] Receipt:', receipt);
        if (receipt && receipt.status === '0x1') {
          txHash = hash;
        }
      } catch (chainErr: any) {
        console.warn('On-chain registration failed:', chainErr);
        // Non-blocking: continue with backend registration
      }

      // Step 2: Backend registration
      setStep('form');
      await register({
        walletAddress,
        nickname: nickname.trim(),
        phone: phone.trim() || undefined,
        txHash: txHash || undefined,
      });

      navigate('/member/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '注册失败，请重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">完善个人信息</h1>
          <p className="text-gray-500 text-sm mt-1">
            完成注册后即可使用全部功能
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
            <input
              type="text"
              value={walletAddress}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="选填"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {step === 'chain' ? '链上注册中...' : '注册中...'}
              </>
            ) : (
              '完成注册'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
