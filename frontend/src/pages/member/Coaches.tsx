import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Dumbbell, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function MemberCoaches() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState('');
  const [tab, setTab] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'all') loadCoaches();
    else loadFavorites();
  }, [page, specialty, tab]);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 12 };
      if (specialty) params.specialty = specialty;
      const res = await api.get('/coaches', { params });
      setCoaches(res.data.list);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coaches/favorites');
      setFavorites(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (coachId: number) => {
    try {
      await api.post(`/coaches/${coachId}/favorite`);
      if (tab === 'all') loadCoaches();
      else loadFavorites();
    } catch {
      // ignore
    }
  };

  const totalPages = Math.ceil(total / 12);
  const displayList = tab === 'all' ? coaches : favorites;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">教练列表</h1>

      {/* Tabs + Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => { setTab('all'); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium ${tab === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            全部教练
          </button>
          <button onClick={() => setTab('favorites')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'favorites' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            我的收藏
          </button>
        </div>
        {tab === 'all' && (
          <select value={specialty} onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部擅长</option>
            <option value="瑜伽">瑜伽</option>
            <option value="力量">力量训练</option>
            <option value="HIIT">HIIT</option>
            <option value="拳击">拳击</option>
            <option value="普拉提">普拉提</option>
          </select>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {tab === 'favorites' ? '暂无收藏教练' : '暂无教练'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayList.map((coach: any) => (
            <div key={coach.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center relative hover:shadow-md transition-shadow">
              <button
                onClick={(e) => { e.preventDefault(); toggleFavorite(coach.id); }}
                className="absolute top-3 right-3"
              >
                <Heart className={`w-5 h-5 ${coach.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
              </button>
              <Link to={`/member/coaches/${coach.id}`}>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100">
                  {coach.avatar ? (
                    <img src={coach.avatar.startsWith('http') ? coach.avatar : `http://localhost:3001/${coach.avatar}`}
                      alt={coach.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400">
                      <Dumbbell className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{coach.specialties}</p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'all' && totalPages > 1 && (
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
