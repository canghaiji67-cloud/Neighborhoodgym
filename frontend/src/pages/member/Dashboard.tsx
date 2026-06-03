import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  CreditCard,
  Zap,
  CalendarCheck,
  Trophy,
  Crown,
  Loader2,
  Edit,
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/useAuthStore';
import useContractStore from '../../stores/useContractStore';
import { ethers } from 'ethers';

const LEVEL_LABELS: Record<string, string> = {
  normal: '普通会员',
  silver: '白银会员',
  gold: '黄金会员',
  diamond: '钻石会员',
};

const LEVEL_COLORS: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700',
  silver: 'bg-gray-200 text-gray-800',
  gold: 'bg-amber-100 text-amber-700',
  diamond: 'bg-purple-100 text-purple-700',
};

const PLAN_LABELS: Record<number, string> = { 1: '月卡', 2: '季卡', 3: '年卡' };

export default function MemberDashboard() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Membership purchase
  const [buyPlan, setBuyPlan] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, memberRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/user/membership'),
      ]);
      setProfile(profileRes.data.data);
      setMembership(memberRes.data.data);
      setNickname(profileRes.data.data.nickname || '');
      setPhone(profileRes.data.data.phone || '');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/user/profile', { nickname, phone });
      setProfile(res.data.data);
      setUser({ ...user!, nickname: res.data.data.nickname, phone: res.data.data.phone });
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleBuyMembership = async (planType: number) => {
    setBuyError('');
    setBuyLoading(true);
    try {
      await useContractStore.getState().initProvider();
      const { membershipManager } = useContractStore.getState().contracts;
      if (!membershipManager) throw new Error('合约未初始化');

      const priceGetters: Record<number, () => Promise<bigint>> = {
        1: () => membershipManager.MONTHLY_PRICE(),
        2: () => membershipManager.QUARTERLY_PRICE(),
        3: () => membershipManager.YEARLY_PRICE(),
      };
      const price = await priceGetters[planType]();
      const tx = await membershipManager.purchaseMembership(planType, { value: price });
      const receipt = await tx.wait();

      await api.post('/user/membership', {
        txHash: receipt.hash,
        planType,
        amount: ethers.formatEther(price),
      });

      await loadData();
      setBuyPlan(0);
    } catch (err: any) {
      setBuyError(err?.response?.data?.message || err?.message || '购买失败');
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">会员中心</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <Crown className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">会员等级</div>
            <div className={`text-sm font-semibold px-2 py-0.5 rounded mt-0.5 inline-block ${LEVEL_COLORS[profile?.memberLevel || 'normal']}`}>
              {LEVEL_LABELS[profile?.memberLevel || 'normal']}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg">
            <Zap className="w-6 h-6 text-energy" />
          </div>
          <div>
            <div className="text-xs text-gray-500">FitToken 余额</div>
            <div className="text-lg font-bold text-gray-900">{parseFloat(profile?.fitTokenBalance || '0').toFixed(1)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <CalendarCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="text-xs text-gray-500">累计打卡</div>
            <div className="text-lg font-bold text-gray-900">{profile?.checkinCount || 0} 次</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <Trophy className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">课程完成</div>
            <div className="text-lg font-bold text-gray-900">{profile?.courseCompleteCount || 0} 节</div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">个人资料</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              <Edit className="w-4 h-4" /> 编辑
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveProfile} disabled={saving}
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setEditing(false)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">昵称：</span>{profile?.nickname}</div>
            <div><span className="text-gray-500">手机号：</span>{profile?.phone || '未设置'}</div>
            <div className="col-span-2"><span className="text-gray-500">钱包地址：</span><span className="font-mono text-xs">{profile?.walletAddress}</span></div>
          </div>
        )}
      </div>

      {/* Membership Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">会员卡</h2>
        {membership?.current ? (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl p-6 text-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">{PLAN_LABELS[membership.current.planType] || '会员卡'}</span>
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="text-sm opacity-80">
              到期时间：{new Date(membership.current.expiresAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">暂无会员卡，立即购买享受更多权益</p>
        )}

        {/* Buy Plans */}
        {buyPlan === 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 1, label: '月卡', desc: '30 天' },
              { type: 2, label: '季卡', desc: '90 天' },
              { type: 3, label: '年卡', desc: '365 天' },
            ].map((p) => (
              <button
                key={p.type}
                onClick={() => setBuyPlan(p.type)}
                className="border border-gray-200 rounded-xl p-4 hover:border-primary-500 hover:shadow-md transition text-center"
              >
                <div className="font-semibold text-gray-900">{p.label}</div>
                <div className="text-xs text-gray-500 mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-primary-200 bg-primary-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-3">
              确认购买 <strong>{PLAN_LABELS[buyPlan]}</strong>？将通过 MetaMask 发起 ETH 支付。
            </p>
            {buyError && <p className="text-sm text-red-600 mb-2">{buyError}</p>}
            <div className="flex gap-3">
              <button onClick={() => handleBuyMembership(buyPlan)} disabled={buyLoading}
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                {buyLoading ? '支付中...' : '确认支付'}
              </button>
              <button onClick={() => { setBuyPlan(0); setBuyError(''); }}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
