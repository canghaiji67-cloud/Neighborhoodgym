import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Loader2, X, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

export default function AdminHomepage() {
  const [tab, setTab] = useState<'gymInfo' | 'carousels' | 'announcements' | 'gallery'>('gymInfo');
  const [loading, setLoading] = useState(true);

  // Gym Info
  const [gymInfo, setGymInfo] = useState({ name: '', slogan: '', description: '', address: '', phone: '', businessHours: '' });
  const [gymSaving, setGymSaving] = useState(false);

  // Carousels
  const [carousels, setCarousels] = useState<any[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', isPinned: false, status: 'published' });
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [gi, ca, an, ga] = await Promise.all([
        api.get('/admin/homepage/gym-info'),
        api.get('/admin/homepage/carousels'),
        api.get('/admin/homepage/announcements'),
        api.get('/admin/homepage/gallery'),
      ]);
      if (gi.data.data) setGymInfo(gi.data.data);
      setCarousels(ca.data.data || []);
      setAnnouncements(an.data.data || []);
      setGallery(ga.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  // Gym Info save
  const saveGymInfo = async () => {
    setGymSaving(true);
    try { await api.put('/admin/homepage/gym-info', gymInfo); } catch {} finally { setGymSaving(false); }
  };

  // Carousel delete
  const deleteCarousel = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/admin/homepage/carousels/${id}`); loadAll(); } catch {}
  };

  // Announcement CRUD
  const openAddAnnouncement = () => {
    setEditAnnouncement(null);
    setAnnouncementForm({ title: '', content: '', isPinned: false, status: 'published' });
    setShowAnnouncementModal(true);
  };

  const openEditAnnouncement = (a: any) => {
    setEditAnnouncement(a);
    setAnnouncementForm({ title: a.title, content: a.content, isPinned: a.isPinned, status: a.status });
    setShowAnnouncementModal(true);
  };

  const saveAnnouncement = async () => {
    setAnnouncementSaving(true);
    try {
      if (editAnnouncement) {
        await api.put(`/admin/homepage/announcements/${editAnnouncement.id}`, announcementForm);
      } else {
        await api.post('/admin/homepage/announcements', announcementForm);
      }
      setShowAnnouncementModal(false);
      loadAll();
    } catch {} finally { setAnnouncementSaving(false); }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/admin/homepage/announcements/${id}`); loadAll(); } catch {}
  };

  // Gallery delete
  const deleteGalleryImage = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/admin/homepage/gallery/${id}`); loadAll(); } catch {}
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">首页管理</h1>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden w-fit">
        {[
          { key: 'gymInfo' as const, label: '健身房信息' },
          { key: 'carousels' as const, label: '轮播图' },
          { key: 'announcements' as const, label: '公告' },
          { key: 'gallery' as const, label: '环境图片' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.key ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Gym Info Tab */}
      {tab === 'gymInfo' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 max-w-2xl">
          {['name', 'slogan', 'address', 'phone', 'businessHours'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {{ name: '名称', slogan: '标语', address: '地址', phone: '电话', businessHours: '营业时间' }[field]}
              </label>
              <input value={(gymInfo as any)[field] || ''} onChange={(e) => setGymInfo({ ...gymInfo, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={gymInfo.description} onChange={(e) => setGymInfo({ ...gymInfo, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <button onClick={saveGymInfo} disabled={gymSaving}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1">
            <Save className="w-4 h-4" /> {gymSaving ? '保存中...' : '保存'}
          </button>
        </div>
      )}

      {/* Carousels Tab */}
      {tab === 'carousels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {carousels.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-40 bg-gray-100">
                  {c.imageUrl && (
                    <img src={c.imageUrl.startsWith('http') ? c.imageUrl : `http://localhost:3001/${c.imageUrl}`}
                      alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">排序: {c.sortOrder}</span>
                  <button onClick={() => deleteCarousel(c.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">提示：通过 API 或 Postman 上传轮播图 (POST /api/admin/homepage/carousels with file field)</p>
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-4">
          <button onClick={openAddAnnouncement}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> 添加公告
          </button>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {a.isPinned && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">置顶</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status === 'published' ? '已发布' : '草稿'}
                    </span>
                    <h3 className="font-medium text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{a.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button onClick={() => openEditAnnouncement(a)} className="text-primary-500 hover:text-primary-600 text-sm">编辑</button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAnnouncementModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{editAnnouncement ? '编辑公告' : '添加公告'}</h2>
                  <button onClick={() => setShowAnnouncementModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                    <input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                    <textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-28 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={announcementForm.isPinned}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, isPinned: e.target.checked })} />
                      置顶
                    </label>
                    <select value={announcementForm.status} onChange={(e) => setAnnouncementForm({ ...announcementForm, status: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option value="published">已发布</option>
                      <option value="draft">草稿</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveAnnouncement} disabled={announcementSaving}
                      className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                      {announcementSaving ? '保存中...' : '保存'}
                    </button>
                    <button onClick={() => setShowAnnouncementModal(false)}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">取消</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery Tab */}
      {tab === 'gallery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div key={img.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gray-100">
                  {img.imageUrl && (
                    <img src={img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:3001/${img.imageUrl}`}
                      alt={img.description || ''} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{img.description || '-'}</span>
                  <button onClick={() => deleteGalleryImage(img.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">提示：通过 API 上传环境图片 (POST /api/admin/homepage/gallery with file field)</p>
        </div>
      )}
    </div>
  );
}
