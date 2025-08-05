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
    <main className="min-h-screen bg-[#E1FFFF] flex flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-[#00003D] mb-4 text-center">
          ⚠ Reset Training Data
        </h1>
        <p className="mb-6 text-black text-center">
          This will permanently delete <span className="font-semibold">all</span> training files 
          from OpenAI and MongoDB. This action cannot be undone.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full px-6 py-3 bg-[#B00020] hover:bg-[#7F0017] text-white font-medium 
                       rounded-md shadow-sm transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                       disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete All Training Data'}
          </button>

          {status && (
            <p
              className={`mt-2 text-sm font-medium ${
                status.toLowerCase().includes('error')
                  ? 'text-[#B00020]'
                  : 'text-emerald-600'
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
