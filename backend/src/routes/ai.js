const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { ChatSession, ChatMessage } = require('../models');
const aiService = require('../services/aiService');

// All AI routes require JWT
router.use(authenticateToken);

// POST /api/ai/chat - send message and get streaming response
router.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: true,
        message: '消息不能为空',
        code: 'EMPTY_MESSAGE',
      });
    }

    const userId = req.user.id;
    let session;

    // Create or find session
    if (sessionId) {
      session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      });
      if (!session) {
        return res.status(404).json({
          error: true,
          message: '对话不存在',
          code: 'SESSION_NOT_FOUND',
        });
      }
    } else {
      // Create new session
      session = await ChatSession.create({
        userId,
        title: '新对话',
      });
    }

    // Save user message
    await ChatMessage.create({
      sessionId: session.id,
      role: 'user',
      content: message.trim(),
    });

    // Build context: system prompt + user context + history
    const userContext = await aiService.buildUserContext(userId);
    const systemPrompt = aiService.BASE_SYSTEM_PROMPT + userContext;

    // Load recent history (last 20 messages in this session)
    const history = await ChatMessage.findAll({
      where: { sessionId: session.id },
      order: [['created_at', 'ASC']],
      limit: 20,
      offset: Math.max(
        0,
        (await ChatMessage.count({ where: { sessionId: session.id } })) - 20
      ),
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Generate title for new sessions (first message)
    if (!sessionId) {
      aiService.generateTitle(message.trim()).then(async (title) => {
        session.title = title;
        await session.save();
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send session info first
    res.write(
      `data: ${JSON.stringify({ type: 'session', sessionId: session.id })}\n\n`
    );

    let fullResponse = '';

    aiService.streamChat(
      messages,
      // onChunk
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },
      // onDone
      async () => {
        // Save assistant response
        if (fullResponse) {
          await ChatMessage.create({
            sessionId: session.id,
            role: 'assistant',
            content: fullResponse,
          });
        }
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      },
      // onError
      (err) => {
        console.error('[AI Chat] Stream error:', err.message);
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`
        );
        res.end();
      }
    );

    // Handle client disconnect
    req.on('close', () => {
      // Save partial response if any
      if (fullResponse) {
        ChatMessage.create({
          sessionId: session.id,
          role: 'assistant',
          content: fullResponse,
        }).catch(() => {});
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/sessions - list user's chat sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { userId: req.user.id },
      order: [['updated_at', 'DESC']],
      attributes: ['id', 'title', 'createdAt', 'updatedAt'],
    });

    res.json({ error: false, data: sessions });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/sessions/:id/messages - get messages for a session
router.get('/sessions/:id/messages', async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) {
      return res.status(404).json({
        error: true,
        message: '对话不存在',
        code: 'SESSION_NOT_FOUND',
      });
    }

    const messages = await ChatMessage.findAll({
      where: { sessionId: session.id },
      order: [['created_at', 'ASC']],
      attributes: ['id', 'role', 'content', 'createdAt'],
    });

    res.json({ error: false, data: messages });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ai/sessions/:id - delete a chat session
router.delete('/sessions/:id', async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) {
      return res.status(404).json({
        error: true,
        message: '对话不存在',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Messages cascade-deleted via FK constraint
    await session.destroy();

    res.json({ error: false, data: { message: '对话已删除' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
