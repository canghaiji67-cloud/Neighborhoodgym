const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { User, Course, Coach, CheckIn, Booking, Membership } = require('../models');
const { Op } = require('sequelize');

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

function getDeepSeekApiKey() {
  const envKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_AI_KEY;
  if (envKey) return envKey;

  try {
    const envPath = path.join(__dirname, '..', '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*DEEPSEEK_(?:API|AI)_KEY\s*=\s*(.+?)\s*$/m);
    if (match && match[1]) {
      return match[1].replace(/^['"]|['"]$/g, '');
    }
  } catch (_) {
    // ignore fallback read errors
  }

  return '';
}

// ==================== System Prompt Builder ====================

const BASE_SYSTEM_PROMPT = `你是 GymChain 健身房的 AI 智能助手，名字叫"小健"。你的职责是帮助会员解答健身相关问题，提供专业的健身建议。

## 你的能力范围：
1. **智能客服**：回答关于健身房的各类问题
2. **课程咨询**：介绍课程信息、推荐合适课程
3. **收费标准**：解答会员卡和课程费用问题
4. **健身建议**：根据用户情况提供个性化训练计划和饮食建议
5. **常见问题**：解答健身房使用的常见疑问

## 健身房基本信息：
- 名称：GymChain 区块链健身房
- 特色：采用区块链技术管理会员身份和成就系统
- 代币：FitToken (FIT)，通过打卡和完成课程获取奖励
- 打卡奖励：每日打卡获得 10 FIT，连续打卡有里程碑奖励（7天50FIT, 30天300FIT, 100天1000FIT）
- 成就徽章：以 NFT 形式颁发，记录在区块链上永久保存

## 会员卡收费标准：
- 月卡：0.01 ETH（30天有效期）
- 季卡：0.025 ETH（90天有效期）
- 年卡：0.08 ETH（365天有效期）
- 支付方式：通过 MetaMask 钱包使用 ETH 支付

## 会员等级体系：
- 普通会员：默认等级
- 银卡会员：打卡 ≥ 30次 或 完成课程 ≥ 10节
- 金卡会员：打卡 ≥ 100次 且 完成课程 ≥ 30节
- 钻石会员：打卡 ≥ 300次 且 完成课程 ≥ 100节

## 回答规范：
- 使用友好、专业的语气
- 回答简洁明了，重点突出
- 涉及具体数据时尽量准确
- 健身建议要注意安全提醒
- 如果不确定，诚实告知并建议咨询专业教练
- 使用 Markdown 格式让回答更加清晰`;

/**
 * Build dynamic context based on user data and available courses
 */
async function buildUserContext(userId) {
  const parts = [];

  try {
    // User profile
    const user = await User.findByPk(userId, { attributes: { exclude: ['nonce'] } });
    if (user) {
      parts.push(`\n## 当前用户信息：
- 昵称：${user.nickname || '未设置'}
- 会员等级：${user.memberLevel || 'normal'}
- 钱包地址：${user.walletAddress}`);
    }

    // Check-in stats
    const checkinCount = await CheckIn.count({ where: { user_id: userId } });
    const courseCompleteCount = await Booking.count({
      where: { user_id: userId, status: 'checked_in' },
    });
    parts.push(`- 累计打卡：${checkinCount} 次
- 完成课程：${courseCompleteCount} 节`);

    // Membership info
    const membership = await Membership.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    if (membership) {
      const planNames = { 1: '月卡', 2: '季卡', 3: '年卡' };
      const isExpired = new Date(membership.expiresAt) < new Date();
      parts.push(`- 会员卡：${planNames[membership.planType] || '未知'}（${isExpired ? '已过期' : '有效期至 ' + new Date(membership.expiresAt).toLocaleDateString('zh-CN')}）`);
    } else {
      parts.push('- 会员卡：暂未购买');
    }

    // Available courses (upcoming)
    const courses = await Course.findAll({
      where: {
        startTime: { [Op.gt]: new Date() },
        status: 'active',
      },
      include: [{ model: Coach, as: 'coach', attributes: ['name', 'specialties'] }],
      order: [['startTime', 'ASC']],
      limit: 10,
    });

    if (courses.length > 0) {
      parts.push('\n## 近期可预约课程：');
      courses.forEach((c) => {
        const time = new Date(c.startTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        parts.push(`- ${c.title}（${c.category || '综合'}）| 教练：${c.coach?.name || '未知'} | 时间：${time} | 地点：${c.location || '未知'} | 费用：${c.fitTokenCost || 0} FIT | 名额：${c.enrolledCount || 0}/${c.maxCapacity || 0}`);
      });
    }
  } catch (err) {
    console.error('[aiService] Failed to build user context:', err.message);
  }

  return parts.join('\n');
}

// ==================== DeepSeek API Caller ====================

/**
 * Call DeepSeek API with streaming response
 * @param {Array} messages - chat messages array [{role, content}]
 * @param {Function} onChunk - callback for each streamed text chunk
 * @param {Function} onDone - callback when streaming is complete
 * @param {Function} onError - callback on error
 */
function streamChat(messages, onChunk, onDone, onError) {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    onError(new Error('DEEPSEEK_API_KEY not configured'));
    return;
  }

  const body = JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const url = new URL('/chat/completions', DEEPSEEK_BASE_URL);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const req = lib.request(
    {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'text/event-stream',
      },
    },
    (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', (chunk) => (errBody += chunk));
        res.on('end', () => {
          onError(new Error(`DeepSeek API error ${res.statusCode}: ${errBody}`));
        });
        return;
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (_) {
            // skip unparseable chunks
          }
        }
      });

      res.on('end', () => {
        // Process any remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              onDone();
              return;
            }
          }
        }
        onDone();
      });
    }
  );

  req.on('error', (err) => {
    onError(err);
  });

  req.write(body);
  req.end();

  return req;
}

/**
 * Generate a short title from the first user message
 */
async function generateTitle(userMessage) {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) return userMessage.slice(0, 20);

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: '请用10个字以内概括用户消息的主题，直接输出标题，不要加任何标点和前缀。',
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 30,
      temperature: 0.3,
    });

    const url = new URL('/chat/completions', DEEPSEEK_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const title = parsed.choices?.[0]?.message?.content?.trim();
            resolve(title || userMessage.slice(0, 20));
          } catch {
            resolve(userMessage.slice(0, 20));
          }
        });
      }
    );

    req.on('error', () => resolve(userMessage.slice(0, 20)));
    req.write(body);
    req.end();
  });
}

module.exports = {
  BASE_SYSTEM_PROMPT,
  buildUserContext,
  streamChat,
  generateTitle,
};
