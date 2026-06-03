import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  booked: { label: '已预约', cls: 'bg-blue-100 text-blue-700' },
  pending_payment: { label: '待支付', cls: 'bg-yellow-100 text-yellow-700' },
  checked_in: { label: '已签到', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', cls: 'bg-gray-100 text-gray-700' },
  expired: { label: '已过期', cls: 'bg-gray-100 text-gray-500' },
};

export default function MemberBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { page, pageSize: 10 } });
      setBookings(res.data.list);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">我的预约</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">暂无预约记录</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
              <tr>
                <th className="px-6 py-3 text-left">课程</th>
                <th className="px-6 py-3 text-left">教练</th>
                <th className="px-6 py-3 text-left">时间</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const status = STATUS_MAP[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {b.course?.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {b.course?.coach?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {b.course?.startTime ? new Date(b.course.startTime).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      {b.course && (
                        <Link to={`/member/courses/${b.course.id}`} className="text-sm text-primary-500 hover:text-primary-600">
                          查看
                        </Link>
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
