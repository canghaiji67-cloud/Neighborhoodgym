import { useEffect, useState } from 'react';
import {
  Users,
  UserCog,
  BookOpen,
  CalendarCheck,
  Trophy,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';

const STAT_CARDS = [
  { key: 'totalUsers', label: '用户总数', icon: Users, gradient: 'from-blue-500 to-blue-600' },
  { key: 'totalCoaches', label: '教练总数', icon: UserCog, gradient: 'from-green-500 to-green-600' },
  { key: 'totalCourses', label: '课程总数', icon: BookOpen, gradient: 'from-purple-500 to-purple-600' },
  { key: 'todayCheckins', label: '今日打卡', icon: TrendingUp, gradient: 'from-orange-500 to-orange-600' },
  { key: 'totalBookings', label: '预约总数', icon: CalendarCheck, gradient: 'from-cyan-500 to-cyan-600' },
  { key: 'totalAchievementsClaimed', label: 'NFT成就总数', icon: Trophy, gradient: 'from-amber-500 to-amber-600' },
];

const CATEGORY_LABELS: Record<string, string> = {
  strength: '力量训练',
  yoga: '瑜伽',
  pilates: '普拉提',
  swimming: '游泳',
  spinning: '动感单车',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/stats/trends'),
    ])
      .then(([statsRes, trendsRes]) => {
        setStats(statsRes.data.data);
        setTrends(trendsRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const dailyData = trends?.daily || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieLabel = ({ name, percent }: any) =>
    `${name} ${(percent * 100).toFixed(0)}%`;
  const courseCategories = (trends?.courseCategories || []).map((item: any) => ({
    ...item,
    name: CATEGORY_LABELS[item.name] || item.name,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">统计面板</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
            >
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white flex-shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{card.label}</div>
                <div className="text-xl font-bold text-gray-900">
                  {stats?.[card.key] ?? 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            近7天打卡趋势
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="checkins"
                name="打卡次数"
                stroke="#6366f1"
                fill="url(#colorCheckins)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            近7天预约统计
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="bookings"
                name="预约数"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Users Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            近7天新增用户
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="newUsers"
                name="新增用户"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            课程分类分布
          </h3>
          {courseCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={courseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {courseCategories.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400">
              暂无课程数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
