import { useState, useEffect } from 'react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface DeletedRecord {
  id: number;
  tableName: string;
  recordId: number;
  data: any;
  deletedAt: string;
  purgeAt: string;
}

export default function DeletedRecordsPage() {
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/deleted-records');
      setRecords(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/deleted-records/${id}/restore`);
      alert(`Restored ${res.data.tableName} record`);
      fetchRecords();
    } catch (e: any) {
      alert('Failed to restore: ' + (e?.response?.data?.error || e?.message || 'Unknown error'));
    }
  };

  const handlePurge = async () => {
    const result = await confirmDelete('all expired records');
    if (!result.isConfirmed) return;
    try {
      await api.post('/deleted-records/purge');
      toastSuccess('Expired records purged');
      fetchRecords();
    } catch (e: any) {
      toastError('Purge failed');
      console.error(e);
    }
  };

  const getSummary = (r: DeletedRecord) => {
    const d = r.data;
    return d.name || d.title || `${r.tableName} #${r.recordId}`;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Deleted Records</h1>
        <button className="btn btn-secondary" onClick={handlePurge}>Purge Expired</button>
      </div>
      {records.length === 0 ? (
        <p>No deleted records found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Summary</th>
              <th>Deleted At</th>
              <th>Purges On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td><span className="badge badge-info">{r.tableName}</span></td>
                <td>{getSummary(r)}</td>
                <td>{new Date(r.deletedAt).toLocaleString()}</td>
                <td>{new Date(r.purgeAt).toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => handleRestore(r.id)}>Restore</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
