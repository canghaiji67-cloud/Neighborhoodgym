import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import api from '../../services/api';

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    title: '', category: 'yoga', coachId: '', startTime: '', endTime: '',
    location: '', maxCapacity: '30', fitTokenCost: '0', description: '',
    difficulty: 'beginner', suitableFor: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { loadCourses(); loadCoaches(); }, [page]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses', { params: { page, pageSize: 10 } });
      setCourses(res.data.list);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  const loadCoaches = async () => {
    try {
      const res = await api.get('/admin/coaches', { params: { page: 1, pageSize: 50 } });
      setCoaches(res.data.list);
    } catch {}
  };

  const openAdd = () => {
    setEditCourse(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditCourse(c);
    setForm({
      title: c.title, category: c.category, coachId: String(c.coachId),
      startTime: c.startTime?.slice(0, 16) || '', endTime: c.endTime?.slice(0, 16) || '',
      location: c.location || '', maxCapacity: String(c.maxCapacity),
      fitTokenCost: String(c.fitTokenCost || 0), description: c.description || '',
      difficulty: c.difficulty, suitableFor: c.suitableFor || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, coachId: Number(form.coachId), maxCapacity: Number(form.maxCapacity), fitTokenCost: Number(form.fitTokenCost) };
      if (editCourse) {
        await api.put(`/admin/courses/${editCourse.id}`, payload);
      } else {
        await api.post('/admin/courses', payload);
      }
      setShowModal(false);
      loadCourses();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该课程？')) return;
    try { await api.delete(`/admin/courses/${id}`); loadCourses(); } catch {}
  };

  const toggleStatus = async (id: number, current: string) => {
    try {
      await api.put(`/admin/courses/${id}/status`, { status: current === 'active' ? 'inactive' : 'active' });
      loadCourses();
    } catch {}
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        <button onClick={openAdd} className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> 添加课程
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm font-medium uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">课程名</th>
                <th className="px-4 py-3 text-left">分类</th>
                <th className="px-4 py-3 text-left">教练</th>
                <th className="px-4 py-3 text-left">开始时间</th>
                <th className="px-4 py-3 text-left">报名</th>
                <th className="px-4 py-3 text-left">FIT</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{c.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.coach?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.startTime ? new Date(c.startTime).toLocaleString('zh-CN') : '-'}</td>
                  <td className="px-4 py-3 text-sm">{c.enrolledCount}/{c.maxCapacity}</td>
                  <td className="px-4 py-3 text-sm text-energy">{c.fitTokenCost || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(c.id, c.status)}
                      className={`text-xs px-2 py-1 rounded font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {c.status === 'active' ? '上架' : '下架'}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-primary-500 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editCourse ? '编辑课程' : '添加课程'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  {['yoga','hiit','spinning','strength','boxing','pilates','swimming','dance','other'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">教练 *</label>
                <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="">选择教练</option>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始时间 *</label>
                <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束时间 *</label>
                <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大容量</label>
                <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FitToken 费用</label>
                <input type="number" value={form.fitTokenCost} onChange={(e) => setForm({ ...form, fitTokenCost: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">适合人群</label>
                <input value={form.suitableFor} onChange={(e) => setForm({ ...form, suitableFor: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} disabled={saving}
                className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
