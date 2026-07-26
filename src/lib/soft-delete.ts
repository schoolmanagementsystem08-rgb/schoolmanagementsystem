import { db } from '../db';
import { deletedRecords } from '../db/schema';
import { eq, sql, lt } from 'drizzle-orm';

export async function softDelete(tableName: string, recordId: number, extra: Record<string, any> = {}) {
  const raw = await db.execute(sql`SELECT row_to_json(t) FROM ${sql.identifier(tableName)} t WHERE id = ${recordId}`);
  if (!raw.rows?.length) return;
  const data = { ...(raw.rows[0].row_to_json as Record<string, any>), ...extra };
  const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(deletedRecords).values({
    tableName,
    recordId,
    data,
    purgeAt,
  });
  await db.execute(sql`DELETE FROM ${sql.identifier(tableName)} WHERE id = ${recordId}`);
}

export async function purgeExpired() {
  const cutoff = new Date();
  const result = await db.delete(deletedRecords).where(lt(deletedRecords.purgeAt, cutoff)).returning();
  if (result.length > 0) {
    console.log(`[Purge] Permanently deleted ${result.length} expired record(s)`);
  }
}

export async function getDeletedRecords(tableName?: string) {
  let query = db.select().from(deletedRecords).orderBy(deletedRecords.deletedAt);
  if (tableName) {
    query = query.where(eq(deletedRecords.tableName, tableName)) as any;
  }
  return query;
}

export async function restoreDeletedRecord(id: number) {
  const [record] = await db.select().from(deletedRecords).where(eq(deletedRecords.id, id)).limit(1);
  if (!record) throw new Error('Deleted record not found');
  const data = record.data as Record<string, any>;
  const { id: _, ...values } = data;
  const cols = Object.keys(values).map(k => sql.identifier(k));
  const vals = Object.values(values).map(v => {
    if (v === null || v === undefined) return sql`NULL`;
    if (typeof v === 'object') return sql`${JSON.stringify(v)}::jsonb`;
    if (typeof v === 'number') return sql`${v}`;
    return sql`${String(v)}`;
  });
  await db.execute(sql`INSERT INTO ${sql.identifier(record.tableName)} (${sql.join(cols, sql`, `)}) VALUES (${sql.join(vals, sql`, `)})`);
  await db.delete(deletedRecords).where(eq(deletedRecords.id, id));
  return { tableName: record.tableName, restored: values };
}
