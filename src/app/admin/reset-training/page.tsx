'use client';

import { useState } from 'react';

export default function ResetTrainingPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/flush-training', {
        method: 'POST',
      });

      const data = await res.json();
      setStatus(data.message || 'Success');
    } catch (error) {
      setStatus('Error deleting training data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Training Data</h1>
      <p className="mb-4">This will permanently delete all training files from OpenAI and MongoDB.</p>
      <button
        onClick={handleReset}
        disabled={loading}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        {loading ? 'Deleting...' : 'Delete All Training Data'}
      </button>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </main>
  );
}
