import { Router } from 'express';
import { db } from '../db';
import { messages, users } from '../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = Number(userId);

    const allMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderName: users.name,
        receiverId: messages.receiverId,
        body: messages.body,
        read: messages.read,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(or(eq(messages.senderId, uid), eq(messages.receiverId, uid)))
      .orderBy(messages.createdAt);

    const roomsMap = new Map();
    allMessages.forEach(msg => {
      const otherId = msg.senderId === uid ? msg.receiverId : msg.senderId;
      if (!roomsMap.has(otherId)) {
        roomsMap.set(otherId, {
          userId: otherId,
          name: msg.senderId === uid ? `User #${otherId}` : msg.senderName,
          lastMsg: msg.body,
          time: msg.createdAt,
          unread: !msg.read && msg.receiverId === uid ? 1 : 0,
        });
      } else {
        const room = roomsMap.get(otherId);
        if (!msg.read && msg.receiverId === uid) room.unread++;
      }
    });

    res.json(Array.from(roomsMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:userId/:otherId', async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const uid = Number(userId);
    const oid = Number(otherId);

    const msgs = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        text: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, uid), eq(messages.receiverId, oid)),
          and(eq(messages.senderId, oid), eq(messages.receiverId, uid))
        )
      )
      .orderBy(messages.createdAt);

    await db
      .update(messages)
      .set({ read: true })
      .where(and(eq(messages.senderId, oid), eq(messages.receiverId, uid)));

    res.json(msgs);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { senderId, receiverId, body } = req.body;
    if (!senderId || !receiverId || !body) {
      return res.status(400).json({ error: 'senderId, receiverId, and body are required' });
    }
    const [created] = await db
      .insert(messages)
      .values({ senderId: Number(senderId), receiverId: Number(receiverId), body, schoolId: schoolId ?? null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
