import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users, Zap, Clock } from 'lucide-react';
import api from '../../services/api';

export default function MemberCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    loadCourses();
  }, [page, category, timeRange, difficulty]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (category) params.category = category;
      if (timeRange) params.timeRange = timeRange;
      if (difficulty) params.difficulty = difficulty;
      const res = await api.get('/courses', { params });
      setCourses(res.data.list);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">课程列表</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">全部分类</option>
          <option value="yoga">瑜伽</option>
          <option value="hiit">HIIT</option>
          <option value="spinning">动感单车</option>
          <option value="strength">力量训练</option>
          <option value="boxing">拳击</option>
          <option value="pilates">普拉提</option>
          <option value="swimming">游泳</option>
          <option value="dance">舞蹈</option>
          <option value="other">其他</option>
        </select>
        <select
          value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">全部难度</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
        </select>
        <select
          value={timeRange} onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">暂无课程</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/member/courses/${course.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded font-medium">
                  {course.category}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {course.difficulty === 'beginner' ? '初级' : course.difficulty === 'intermediate' ? '中级' : '高级'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(course.startTime).toLocaleDateString('zh-CN')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {course.enrolledCount}/{course.maxCapacity}
                </span>
              </div>
              {parseFloat(course.fitTokenCost) > 0 && (
                <div className="mt-2 text-sm text-energy font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {course.fitTokenCost} FIT
                </div>
              )}
              {course.coach && (
                <div className="mt-2 text-xs text-gray-400">教练：{course.coach.name}</div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                p === page
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
