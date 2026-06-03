import { useEffect, useState } from 'react';
import { Plus, Edit, Loader2, X, Trash2 } from 'lucide-react';
import api from '../../services/api';

const RARITY_STYLE: Record<string, { label: string; cls: string }> = {
  common: { label: '普通', cls: 'bg-gray-100 text-gray-700' },
  rare: { label: '稀有', cls: 'bg-blue-100 text-blue-700' },
  epic: { label: '史诗', cls: 'bg-purple-100 text-purple-700' },
  legendary: { label: '传说', cls: 'bg-amber-100 text-amber-700' },
};

const CONDITION_LABEL: Record<string, string> = {
  checkin_total: '累计打卡',
  checkin_streak: '连续打卡',
  course_complete: '课程完成',
};

export default function AdminAchievements() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    name: '', description: '', conditionType: 'checkin_total',
    conditionValue: '', rarity: 'common', badgeImageCid: '', metadataCid: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { loadList(); }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/achievements');
      setList(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditItem(a);
    setForm({
      name: a.name, description: a.description || '', conditionType: a.conditionType,
      conditionValue: String(a.conditionValue), rarity: a.rarity || 'common',
      badgeImageCid: a.badgeImageCid || '', metadataCid: a.metadataCid || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除成就「${name}」吗？已被领取的成就将无法删除。`)) return;
    try {
      await api.delete(`/admin/achievements/${id}`);
      loadList();
    } catch (err: any) {
      alert(err?.response?.data?.message || '删除失败');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, conditionValue: Number(form.conditionValue) };
      if (editItem) {
        await api.put(`/admin/achievements/${editItem.id}`, payload);
      } else {
        await api.post('/admin/achievements', payload);
      }
      setShowModal(false);
      loadList();
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">成就配置</h1>
        <button onClick={openAdd} className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> 添加成就
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-sm font-medium uppercase">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">名称</th>
              <th className="px-6 py-3 text-left">描述</th>
              <th className="px-6 py-3 text-left">条件</th>
              <th className="px-6 py-3 text-left">稀有度</th>
              <th className="px-6 py-3 text-left">Metadata CID</th>
              <th className="px-6 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const rarity = RARITY_STYLE[a.rarity] || RARITY_STYLE.common;
              return (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{a.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{a.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {CONDITION_LABEL[a.conditionType] || a.conditionType} ≥ {a.conditionValue}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${rarity.cls}`}>{rarity.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    {a.metadataCid ? (
                      <span className="text-xs font-mono text-gray-500 max-w-[120px] truncate block" title={a.metadataCid}>{a.metadataCid.substring(0, 12)}...</span>
                    ) : (
                      <span className="text-xs text-gray-400">未设置</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button onClick={() => openEdit(a)} className="text-primary-500 hover:text-primary-600" title="编辑"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id, a.name)} className="text-red-400 hover:text-red-600" title="删除"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editItem ? '编辑成就' : '添加成就'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-16 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件类型 *</label>
                  <select value={form.conditionType} onChange={(e) => setForm({ ...form, conditionType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="checkin_total">累计打卡</option>
                    <option value="checkin_streak">连续打卡</option>
                    <option value="course_complete">课程完成</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件值 *</label>
                  <input type="number" value={form.conditionValue} onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">稀有度</label>
                <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="common">普通</option>
                  <option value="rare">稀有</option>
                  <option value="epic">史诗</option>
                  <option value="legendary">传说</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">徽章图片 CID</label>
                <input value={form.badgeImageCid} onChange={(e) => setForm({ ...form, badgeImageCid: e.target.value })}
                  placeholder="Pinata 上传后获得的图片 CID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">IPFS 图片哈希，如 QmXxx... 或 bafyyy...</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">元数据 CID</label>
                <input value={form.metadataCid} onChange={(e) => setForm({ ...form, metadataCid: e.target.value })}
                  placeholder="Pinata 上传后获得的 JSON 元数据 CID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">ERC-721 Metadata JSON 的 IPFS 哈希，铸造时用作 tokenURI</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
