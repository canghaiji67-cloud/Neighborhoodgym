import { useEffect, useState } from 'react';
import { CalendarCheck, Flame, Zap, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import useContractStore from '../../stores/useContractStore';

export default function MemberCheckin() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [onChainInfo, setOnChainInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRecords();
  }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/checkins', { params: { page, pageSize: 10 } });
      setRecords(res.data.list);
      setTotal(res.data.total);
      setOnChainInfo(res.data.onChainInfo);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setError('');
    setSuccess('');
    setCheckinLoading(true);
    try {
      // 1. Call CheckIn contract on-chain
      await useContractStore.getState().initProvider();
      const { checkIn } = useContractStore.getState().contracts;
      if (!checkIn) throw new Error('CheckIn 合约未初始化');

      const tx = await checkIn.checkIn();
      const receipt = await tx.wait();

      // 2. Submit txHash to backend
      await api.post('/checkins', {
        txHash: receipt.hash,
        exerciseType: 'general',
        durationMinutes: 60,
      });

      setSuccess('打卡成功！FitToken 奖励已发放');
      await loadRecords();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.reason || err?.message || '打卡失败';
      setError(msg);
    } finally {
      setCheckinLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">健身打卡</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg"><CalendarCheck className="w-6 h-6 text-success" /></div>
          <div>
            <div className="text-xs text-gray-500">累计打卡</div>
            <div className="text-xl font-bold text-gray-900">{onChainInfo?.totalCount ?? total} 次</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-lg"><Flame className="w-6 h-6 text-orange-500" /></div>
          <div>
            <div className="text-xs text-gray-500">当前连续</div>
            <div className="text-xl font-bold text-gray-900">{onChainInfo?.currentStreak ?? 0} 天</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg"><Zap className="w-6 h-6 text-energy" /></div>
          <div>
            <div className="text-xs text-gray-500">每日奖励</div>
            <div className="text-xl font-bold text-gray-900">10 FIT</div>
          </div>
        </div>
      </div>

      {/* Checkin Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {error && (
          <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center justify-center gap-2 bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4 max-w-md mx-auto">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
        <button
          onClick={handleCheckin}
          disabled={checkinLoading}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white text-xl font-bold hover:scale-105 transition-transform disabled:opacity-60 shadow-lg mx-auto flex items-center justify-center"
        >
          {checkinLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : '打卡'}
        </button>
        <p className="text-sm text-gray-500 mt-4">
          点击打卡按钮，通过 MetaMask 确认链上交易
        </p>
        <div className="text-xs text-gray-400 mt-2">
          连续 7 天 +50 FIT | 连续 30 天 +300 FIT | 连续 100 天 +1000 FIT
        </div>
      </div>

      {/* Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">打卡记录</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">暂无打卡记录</p>
        ) : (
          <div className="space-y-3">
            {records.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(r.checkInDate).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="text-xs text-gray-500">{r.exerciseType} · {r.durationMinutes} 分钟</div>
                </div>
                <div className="text-xs font-mono text-gray-400 truncate max-w-[200px]">
                  {r.txHash}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg text-sm ${p === page ? 'bg-primary-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
