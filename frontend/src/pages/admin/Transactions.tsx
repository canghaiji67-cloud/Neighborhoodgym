import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../../services/api';

const TYPE_LABELS: Record<string, string> = {
  checkin_reward: '打卡奖励',
  course_payment: '课程支付',
  course_reward: '课程奖励',
  achievement_mint: '成就铸造',
  membership_payment: '会员购买',
};

export default function AdminTransactions() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadList(); }, [page, typeFilter, addressFilter]);

  const loadList = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 15 };
      if (typeFilter) params.type = typeFilter;
      if (addressFilter) params.address = addressFilter;
      const res = await api.get('/admin/transactions', { params });
      setList(res.data.list);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">交易日志</h1>

      <div className="flex gap-4 flex-wrap items-center">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={addressFilter}
            onChange={(e) => { setAddressFilter(e.target.value); setPage(1); }}
            placeholder="搜索地址..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">类型</th>
                <th className="px-4 py-3 text-left">发送方</th>
                <th className="px-4 py-3 text-left">接收方</th>
                <th className="px-4 py-3 text-left">数量</th>
                <th className="px-4 py-3 text-left">交易哈希</th>
                <th className="px-4 py-3 text-left">时间</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{tx.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="bg-primary-50 text-primary-600 text-xs px-2 py-0.5 rounded font-medium">
                      {TYPE_LABELS[tx.type] || tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 max-w-[120px] truncate">
                    {tx.fromAddress === '0x0000000000000000000000000000000000000000' ? (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-medium font-sans">系统铸造</span>
                    ) : tx.fromAddress}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 max-w-[120px] truncate">{tx.toAddress}</td>
                  <td className="px-4 py-3 text-sm font-medium text-energy">{tx.amount}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400 max-w-[140px] truncate">{tx.txHash}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
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
