import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Star, Dumbbell, ChevronLeft, Loader2, Phone } from 'lucide-react';
import api from '../../services/api';

export default function MemberCoachDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoach();
  }, [id]);

  const loadCoach = async () => {
    try {
      const res = await api.get(`/coaches/${id}`);
      setCoach(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      await api.post(`/coaches/${id}/favorite`);
      setCoach((prev: any) => ({ ...prev, isFavorited: !prev.isFavorited }));
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  if (!coach) return <div className="text-center py-16 text-gray-500">教练不存在</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500">
        <ChevronLeft className="w-4 h-4" /> 返回
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {coach.avatar ? (
              <img src={coach.avatar.startsWith('http') ? coach.avatar : `http://localhost:3001/${coach.avatar}`}
                alt={coach.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-400"><Dumbbell className="w-10 h-10" /></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{coach.name}</h1>
              <button onClick={toggleFavorite} className="p-2">
                <Heart className={`w-6 h-6 ${coach.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{coach.specialties}</p>
            {coach.phone && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{coach.phone}</p>
            )}
            {coach.averageRating && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{coach.averageRating}</span>
                <span className="text-xs text-gray-400">({coach.reviewCount} 评价)</span>
              </div>
            )}
            {coach.bio && <p className="text-gray-600 mt-3 text-sm">{coach.bio}</p>}
          </div>
        </div>
      </div>

      {/* Coach's Courses */}
      {coach.courses?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">关联课程</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coach.courses.map((c: any) => (
              <Link key={c.id} to={`/member/courses/${c.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                <h3 className="font-medium text-gray-900">{c.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{c.category}</span>
                  <span>{new Date(c.startTime).toLocaleString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {coach.courseReviews?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">学员评价</h2>
          <div className="space-y-4">
            {coach.courseReviews.map((r: any) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{r.user?.nickname || '匿名'}</span>
                  <div className="flex">{[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}</div>
                </div>
                <p className="text-sm text-gray-600">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
