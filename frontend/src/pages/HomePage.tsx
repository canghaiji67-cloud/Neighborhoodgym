import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  X,
  Image,
  Maximize2,
  Megaphone,
  CalendarDays,
  Star,
  Users,
  Dumbbell,
  Zap,
  Award,
} from 'lucide-react';
import api from '../services/api';

interface HomepageData {
  gymInfo: any;
  carousels: any[];
  hotCourses: any[];
  recommendedCoaches: any[];
  announcements: any[];
  galleryImages: any[];
}

export default function HomePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<number | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/homepage').then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data?.carousels?.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % data.carousels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data?.carousels?.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative space-y-0">
      {/* Full-page background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('http://localhost:3001/public/homepage-bg.jpg')` }}
      />
      <div className="fixed inset-0 -z-10 bg-black/50" />

      {/* Hero Carousel */}
      <section className="relative h-[480px] overflow-hidden">
        {data.carousels.length > 0 ? (
          data.carousels.map((c: any, i: number) => (
            <div
              key={c.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={c.imageUrl?.startsWith('http') ? c.imageUrl : `http://localhost:3001/${c.imageUrl}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg tracking-wide">
            {data.gymInfo?.name || 'GymChain 健身房'}
          </h1>
          <p className="text-xl mb-8 max-w-2xl drop-shadow text-white/90">
            {data.gymInfo?.slogan || '区块链驱动的智能健身体验'}
          </p>
          <Link
            to="/login"
            className="bg-primary-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/30"
          >
            立即加入
          </Link>
        </div>
        {data.carousels.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {data.carousels.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentSlide ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Gym Info */}
      {data.gymInfo && (
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">关于我们</h2>
            <p className="text-white/90 max-w-3xl mx-auto [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">{data.gymInfo.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 flex items-start gap-4 hover:bg-white/15 transition-colors">
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <MapPin className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">地址</div>
                <div className="text-sm text-white/80">{data.gymInfo.address || '暂无'}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 flex items-start gap-4 hover:bg-white/15 transition-colors">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Phone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">联系电话</div>
                <div className="text-sm text-white/80">{data.gymInfo.phone || '暂无'}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 flex items-start gap-4 hover:bg-white/15 transition-colors">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">营业时间</div>
                <div className="text-sm text-white/80">{data.gymInfo.businessHours || '暂无'}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hot Courses */}
      {data.hotCourses?.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white mb-8 text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">热门课程</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.hotCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 hover:bg-white/15 hover:border-white/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded font-medium">
                      {course.category}
                    </span>
                    <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">
                      {course.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{course.title}</h3>
                  <p className="text-sm text-white/70 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">
                      <Users className="w-4 h-4 inline mr-1" />
                      {course.enrolledCount}/{course.maxCapacity}
                    </span>
                    {course.coach && (
                      <span className="text-white/60">{course.coach.name}</span>
                    )}
                  </div>
                  {parseFloat(course.fitTokenCost) > 0 && (
                    <div className="mt-2 text-sm text-amber-400 font-medium">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {course.fitTokenCost} FIT
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended Coaches */}
      {data.recommendedCoaches?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-sm text-primary-300 font-medium bg-primary-500/20 px-3 py-1 rounded-full mb-3">
              <Award className="w-4 h-4" />
              专业团队
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">优秀教练团队</h2>
            <p className="text-white/80 max-w-2xl mx-auto [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
              精选平台推荐的在职教练，覆盖力量训练、瑜伽、普拉提、有氧减脂等多个方向，为你提供更专业的运动指导。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.recommendedCoaches.map((coach: any) => (
              <Link
                key={coach.id}
                to={`/coaches/${coach.id}`}
                className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:-translate-y-1 hover:bg-white/15 hover:border-white/30 transition-all"
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                  {coach.avatar ? (
                    <img
                      src={coach.avatar.startsWith('http') ? coach.avatar : `http://localhost:3001/${coach.avatar}`}
                      alt={coach.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400">
                      <Dumbbell className="w-14 h-14" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-yellow-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    推荐
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{coach.name}</h3>
                      <p className="text-xs text-white/70 mt-1 line-clamp-1">{coach.specialties || '综合训练'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-primary-400 mt-1 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-white/70 line-clamp-3 min-h-[60px]">
                    {coach.bio || '拥有丰富健身指导经验，可根据学员目标制定科学训练方案。'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5" />
                      {coach.courseCount || 0} 门课程
                    </span>
                    {coach.averageRating ? (
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {coach.averageRating}
                      </span>
                    ) : (
                      <span>查看详情</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      {data.announcements?.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-sm text-primary-300 font-medium bg-primary-500/20 px-3 py-1 rounded-full mb-3">
                <Megaphone className="w-4 h-4" />
                官方通知
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">最新公告通知</h2>
              <p className="text-white/80 max-w-2xl mx-auto [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                及时了解健身房活动、课程更新、会员权益和系统通知，点击公告可展开查看全文。
              </p>
            </div>
            <div className="space-y-4 max-w-4xl mx-auto">
              {data.announcements.map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setExpandedAnnouncementId(expandedAnnouncementId === a.id ? null : a.id)}
                  className={`w-full text-left backdrop-blur-md rounded-2xl border p-5 transition-all ${
                    expandedAnnouncementId === a.id
                      ? 'bg-white/15 border-primary-400/40 shadow-lg shadow-primary-500/10'
                      : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {a.isPinned && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                            置顶
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-white/40">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(a.createdAt || a.created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{a.title}</h3>
                      <p className={`text-sm text-white/70 mt-2 leading-6 ${
                        expandedAnnouncementId === a.id ? '' : 'line-clamp-2'
                      }`}>
                        {a.content}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-white/40 mt-1 flex-shrink-0 transition-transform ${
                        expandedAnnouncementId === a.id ? 'rotate-180 text-primary-400' : ''
                      }`}
                    />
                  </div>
                  {expandedAnnouncementId === a.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-primary-400 font-medium">
                      已展开公告全文
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {data.galleryImages?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-sm text-primary-300 font-medium bg-primary-500/20 px-3 py-1 rounded-full mb-3">
              <Image className="w-4 h-4" />
              场馆环境
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">健身房环境图片展示</h2>
            <p className="text-white/80 max-w-2xl mx-auto [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
              浏览训练大厅、力量区、瑜伽室、泳池等场馆环境，点击图片可放大预览。
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[220px] gap-4">
            {data.galleryImages.map((img: any, index: number) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setPreviewImageIndex(index)}
                className={`group relative rounded-2xl overflow-hidden border border-white/20 bg-black/20 text-left hover:border-white/40 transition-all ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
              >
                <img
                  src={img.imageUrl?.startsWith('http') ? img.imageUrl : `http://localhost:3001/${img.imageUrl}`}
                  alt={img.description || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className={`text-white font-medium line-clamp-1 ${index === 0 ? 'text-lg' : 'text-sm'}`}>{img.description || '健身房环境'}</p>
                    <p className="text-white/50 text-xs mt-1">点击查看大图</p>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500 transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {previewImageIndex !== null && data.galleryImages?.[previewImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setPreviewImageIndex(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {data.galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() => setPreviewImageIndex((previewImageIndex - 1 + data.galleryImages.length) % data.galleryImages.length)}
              className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}
          <div className="max-w-5xl w-full">
            <img
              src={
                data.galleryImages[previewImageIndex].imageUrl?.startsWith('http')
                  ? data.galleryImages[previewImageIndex].imageUrl
                  : `http://localhost:3001/${data.galleryImages[previewImageIndex].imageUrl}`
              }
              alt={data.galleryImages[previewImageIndex].description || ''}
              className="max-h-[78vh] w-full object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <p className="font-medium">{data.galleryImages[previewImageIndex].description || '健身房环境'}</p>
              <p className="text-white/60 text-sm mt-1">
                {previewImageIndex + 1} / {data.galleryImages.length}
              </p>
            </div>
          </div>
          {data.galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() => setPreviewImageIndex((previewImageIndex + 1) % data.galleryImages.length)}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
