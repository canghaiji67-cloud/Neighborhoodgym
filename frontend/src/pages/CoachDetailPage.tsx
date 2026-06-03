import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Dumbbell, MapPin, Star, Users, Zap } from 'lucide-react';
import api from '../services/api';

export default function CoachDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/homepage/coaches/${id}`)
      .then((res) => setCoach(res.data.data))
      .catch(() => setCoach(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!coach) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">教练不存在或已离职</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="px-8 pb-8 -mt-16">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-md flex-shrink-0">
                {coach.avatar ? (
                  <img
                    src={coach.avatar.startsWith('http') ? coach.avatar : `http://localhost:3001/${coach.avatar}`}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-500">
                    <Dumbbell className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{coach.name}</h1>
                  {coach.isRecommended && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      推荐教练
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{coach.specialties || '综合训练'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {coach.courses?.length || 0} 门课程
                  </span>
                  {coach.averageRating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {coach.averageRating}（{coach.reviewCount} 条评价）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {coach.bio && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">教练简介</h2>
                <p className="text-gray-600 leading-7 whitespace-pre-wrap">{coach.bio}</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">关联课程</h2>
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              登录后预约课程
            </Link>
          </div>

          {coach.courses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coach.courses.map((course: any) => (
                <div key={course.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-200 hover:shadow-sm transition-all bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded font-medium">{course.category || '课程'}</span>
                    {course.difficulty && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{course.difficulty}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                  {course.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                    {course.startTime && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(course.startTime).toLocaleString('zh-CN')}
                      </span>
                    )}
                    {course.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {course.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.enrolledCount || 0}/{course.maxCapacity || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-energy font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      {course.fitTokenCost || 0} FIT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">该教练暂无上架课程</div>
          )}
        </section>
      </div>
    </div>
  );
}
