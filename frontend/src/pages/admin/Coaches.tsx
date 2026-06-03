import { useEffect, useState } from 'react';
import { Plus, Edit, Loader2, X } from 'lucide-react';
import api from '../../services/api';

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoach, setEditCoach] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', specialties: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCoaches(); }, [page]);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coaches', { params: { page, pageSize: 10 } });
      setCoaches(res.data.list);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditCoach(null);
    setForm({ name: '', phone: '', specialties: '', bio: '' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditCoach(c);
    setForm({ name: c.name, phone: c.phone || '', specialties: c.specialties || '', bio: c.bio || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editCoach) {
        await api.put(`/admin/coaches/${editCoach.id}`, form);
      } else {
        await api.post('/admin/coaches', form);
      }
      setShowModal(false);
      loadCoaches();
    } catch {} finally { setSaving(false); }
  };

  const toggleStatus = async (id: number, current: string) => {
    try {
      await api.put(`/admin/coaches/${id}/status`, { status: current === 'active' ? 'inactive' : 'active' });
      loadCoaches();
    } catch {}
  };

  const toggleRecommend = async (id: number, current: boolean) => {
    try {
      await api.put(`/admin/coaches/${id}/recommend`, { isRecommended: !current });
      loadCoaches();
    } catch {}
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">教练管理</h1>
        <button onClick={openAdd} className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> 添加教练
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium uppercase">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">姓名</th>
                <th className="px-6 py-3 text-left">擅长</th>
                <th className="px-6 py-3 text-left">电话</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">推荐</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{c.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.specialties}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(c.id, c.status)}
                      className={`text-xs px-2 py-1 rounded font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {c.status === 'active' ? '在职' : '离职'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleRecommend(c.id, c.isRecommended)}
                      className={`text-xs px-2 py-1 rounded font-medium ${c.isRecommended ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isRecommended ? '已推荐' : '未推荐'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(c)} className="text-sm text-primary-500 hover:text-primary-600">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editCoach ? '编辑教练' : '添加教练'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">擅长领域</label>
                <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
