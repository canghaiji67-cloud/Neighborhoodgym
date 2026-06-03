import { useEffect, useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  booked: { label: '已预约', cls: 'bg-blue-100 text-blue-700' },
  pending_payment: { label: '待支付', cls: 'bg-yellow-100 text-yellow-700' },
  checked_in: { label: '已签到', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', cls: 'bg-gray-100 text-gray-700' },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState<number | null>(null);

  useEffect(() => { loadBookings(); }, [page, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.list);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  const handleCheckin = async (id: number) => {
    setCheckinLoading(id);
    try {
      await api.put(`/admin/bookings/${id}/checkin`);
      loadBookings();
    } catch {} finally { setCheckinLoading(null); }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">预约管理</h1>

      <div className="flex gap-4 items-center">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="">全部状态</option>
          <option value="booked">已预约</option>
          <option value="pending_payment">待支付</option>
          <option value="checked_in">已签到</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">课程</th>
                <th className="px-4 py-3 text-left">教练</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const status = STATUS_MAP[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{b.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{b.user?.nickname || b.user?.walletAddress?.slice(0, 10) || '-'}</td>
                    <td className="px-4 py-3 text-sm">{b.course?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.course?.coach?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(b.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      {b.status === 'booked' && (
                        <button onClick={() => handleCheckin(b.id)} disabled={checkinLoading === b.id}
                          className="text-sm bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 flex items-center gap-1">
                          {checkinLoading === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          签到
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm ${p === page ? 'bg-primary-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
