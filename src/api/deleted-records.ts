import { Router } from 'express';
import { purgeExpired, getDeletedRecords, restoreDeletedRecord } from '../lib/soft-delete';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const tableName = _req.query.table as string | undefined;
    const records = await getDeletedRecords(tableName);
    res.json(records);
  } catch (error: any) {
    console.error('[DeletedRecords] Error listing:', error?.message);
    res.status(500).json({ error: 'Failed to list deleted records' });
  }
});

router.post('/:id/restore', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await restoreDeletedRecord(id);
    res.json(result);
  } catch (error: any) {
    console.error('[DeletedRecords] Error restoring:', error?.message);
    res.status(500).json({ error: error?.message || 'Failed to restore record' });
  }
});

router.post('/purge', async (_req, res) => {
  try {
    await purgeExpired();
    res.json({ message: 'Purge completed' });
  } catch (error: any) {
    console.error('[DeletedRecords] Error purging:', error?.message);
    res.status(500).json({ error: 'Failed to purge' });
  }
});

export default router;
