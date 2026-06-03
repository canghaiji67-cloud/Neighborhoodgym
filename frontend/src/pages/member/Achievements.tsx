import { useEffect, useState } from 'react';
import { Trophy, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const RARITY_STYLE: Record<string, { label: string; cls: string; gradient: string }> = {
  common: { label: '普通', cls: 'bg-gray-100 text-gray-700', gradient: 'from-gray-100 to-gray-200' },
  rare: { label: '稀有', cls: 'bg-blue-100 text-blue-700', gradient: 'from-blue-100 to-indigo-200' },
  epic: { label: '史诗', cls: 'bg-purple-100 text-purple-700', gradient: 'from-purple-100 to-pink-200' },
  legendary: { label: '传说', cls: 'bg-amber-100 text-amber-700', gradient: 'from-amber-100 to-orange-200' },
};

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

function BadgeImage({ cid, name, size = 'w-16 h-16', iconSize = 'w-8 h-8', gradient = 'from-indigo-100 to-purple-100' }: {
  cid?: string | null; name: string; size?: string; iconSize?: string; gradient?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (cid && !imgError) {
    return (
      <img
        src={`${IPFS_GATEWAY}${cid}`}
        alt={name}
        className={`${size} mx-auto mb-3 rounded-full object-cover border-2 border-white shadow-sm`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={`${size} mx-auto mb-3 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <Trophy className={`${iconSize} text-primary-500`} />
    </div>
  );
}

export default function MemberAchievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'list' | 'badges'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achRes, badgeRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/badges'),
      ]);
      setAchievements(achRes.data.data);
      setBadges(badgeRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id: number) => {
    setError('');
    setSuccess('');
    setClaimingId(id);
    try {
      await api.post(`/achievements/${id}/claim`);
      setSuccess('NFT 徽章铸造成功！');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '领取失败');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">成就徽章</h1>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden w-fit">
        <button onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          成就列表
        </button>
        <button onClick={() => setTab('badges')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'badges' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          我的徽章 ({badges.length})
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-600 text-sm rounded-lg p-3">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {tab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((a) => {
            const rarity = RARITY_STYLE[a.rarity] || RARITY_STYLE.common;
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${rarity.cls}`}>{rarity.label}</span>
                  {a.claimed && <CheckCircle className="w-5 h-5 text-success" />}
                </div>
                <BadgeImage cid={a.badgeImageCid} name={a.name} gradient={rarity.gradient} />
                <h3 className="font-semibold text-gray-900 text-center">{a.name}</h3>
                <p className="text-xs text-gray-500 text-center mt-1">{a.description}</p>
                <div className="text-xs text-gray-400 text-center mt-2">
                  条件：{a.conditionType === 'checkin_total' ? `累计打卡 ${a.conditionValue} 次` :
                    a.conditionType === 'checkin_streak' ? `连续打卡 ${a.conditionValue} 天` :
                    `完成 ${a.conditionValue} 节课`}
                </div>
                <div className="mt-4 text-center">
                  {a.claimed ? (
                    <span className="text-sm text-success font-medium">已领取</span>
                  ) : a.canClaim ? (
                    <button onClick={() => handleClaim(a.id)} disabled={claimingId === a.id}
                      className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg px-4 py-2 text-sm font-medium">
                      {claimingId === a.id ? '铸造中...' : '领取 NFT'}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">条件未满足</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">暂无徽章，完成成就后可领取 NFT</div>
          ) : (
            badges.map((b) => {
              const rarity = RARITY_STYLE[b.achievement?.rarity] || RARITY_STYLE.common;
              return (
                <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <BadgeImage cid={b.achievement?.badgeImageCid} name={b.achievement?.name || ''} size="w-20 h-20" iconSize="w-10 h-10" gradient={rarity.gradient} />
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${rarity.cls}`}>{rarity.label}</span>
                  <h3 className="font-semibold text-gray-900 mt-2">{b.achievement?.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{b.achievement?.description}</p>
                  <div className="text-xs text-gray-400 mt-3 space-y-1">
                    <div>Token ID: #{b.nftTokenId}</div>
                    <div className="font-mono truncate" title={b.mintTxHash}>TX: {b.mintTxHash}</div>
                    {b.claimedAt && <div>获得时间：{new Date(b.claimedAt).toLocaleDateString('zh-CN')}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
