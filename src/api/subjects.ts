import { Router } from 'express';
import { db } from '../db';
import { subjects } from '../db/schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const all = await db.select().from(subjects);
    res.json(all);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

export default router;
