import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Zap, MapPin, Star, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
import useContractStore from '../../stores/useContractStore';
import useAuthStore from '../../stores/useAuthStore';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../utils/contractAddresses';

export default function MemberCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setError('');
    setActionLoading(true);
    try {
      const res = await api.post(`/courses/${id}/book`);
      const booking = res.data.data;

      // If pending payment, initiate FitToken transfer
      if (booking.status === 'pending_payment') {
        await useContractStore.getState().initProvider();
        const { fitToken } = useContractStore.getState().contracts;
        if (!fitToken) throw new Error('FitToken 合约未初始化');

        const amount = ethers.parseEther(String(course.fitTokenCost));
        // Transfer to contract owner (deployer address)
        const ownerAddress = await fitToken.owner();
        const tx = await fitToken.transfer(ownerAddress, amount);
        const receipt = await tx.wait();

        await api.post(`/courses/${id}/confirm-payment`, { txHash: receipt.hash });
      }

      await loadCourse();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '预约失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setError('');
    setActionLoading(true);
    try {
      await api.post(`/courses/${id}/cancel`);
      await loadCourse();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '取消失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      await api.post(`/courses/${id}/review`, {
        rating: reviewRating,
        content: reviewContent,
      });
      setReviewContent('');
      await loadCourse();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '评价失败');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  if (!course) {
    return <div className="text-center py-16 text-gray-500">课程不存在</div>;
  }

  const bookingStatus = course.userBooking?.status;
  const isFree = !course.fitTokenCost || parseFloat(course.fitTokenCost) === 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500">
        <ChevronLeft className="w-4 h-4" /> 返回
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded font-medium">{course.category}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{course.difficulty}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{course.title}</h1>
        <p className="text-gray-600 mb-6">{course.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            {new Date(course.startTime).toLocaleString('zh-CN')}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            {course.enrolledCount}/{course.maxCapacity} 人
          </div>
          {course.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {course.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-energy font-medium">
            <Zap className="w-4 h-4" />
            {isFree ? '免费' : `${course.fitTokenCost} FIT`}
          </div>
        </div>

        {course.coach && (
          <div className="text-sm text-gray-500 mb-4">教练：{course.coach.name}</div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!bookingStatus || bookingStatus === 'cancelled' ? (
            <button onClick={handleBook} disabled={actionLoading}
              className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg px-6 py-2.5 font-medium">
              {actionLoading ? '处理中...' : isFree ? '立即预约' : `预约 (${course.fitTokenCost} FIT)`}
            </button>
          ) : bookingStatus === 'booked' ? (
            <>
              <span className="bg-blue-100 text-blue-700 rounded-lg px-4 py-2.5 text-sm font-medium">已预约</span>
              <button onClick={handleCancel} disabled={actionLoading}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2.5 text-sm">
                取消预约
              </button>
            </>
          ) : bookingStatus === 'pending_payment' ? (
            <span className="bg-yellow-100 text-yellow-700 rounded-lg px-4 py-2.5 text-sm font-medium">待支付</span>
          ) : bookingStatus === 'checked_in' ? (
            <span className="bg-green-100 text-green-700 rounded-lg px-4 py-2.5 text-sm font-medium">已签到</span>
          ) : null}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">课程评价</h2>

        {bookingStatus === 'checked_in' && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">评分：</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}>
                  <Star className={`w-5 h-5 ${s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
              placeholder="分享您的上课体验..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button onClick={handleReview} disabled={reviewLoading}
              className="mt-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
              {reviewLoading ? '提交中...' : '提交评价'}
            </button>
          </div>
        )}

        {course.courseReviews?.length > 0 ? (
          <div className="space-y-4">
            {course.courseReviews.map((r: any) => (
              <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">{r.user?.nickname || '匿名'}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{r.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">暂无评价</p>
        )}
      </div>
    </div>
  );
}
