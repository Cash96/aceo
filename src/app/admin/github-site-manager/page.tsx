'use client';

import { useState } from 'react';

export default function GithubSiteManagerPage() {
  const [projectRepo, setProjectRepo] = useState('');
  const [siteRepo, setSiteRepo] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runStream = async (endpoint: string) => {
    setOutput('');
    setLoading(true);

    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ projectRepo, siteRepo }),
    });

    if (!res.body) {
      setOutput('❌ No response body');
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value);
      setOutput(prev => prev + chunk);
    }

    setLoading(false);
  };

  const handleFlashTrain = async () => {
    await runStream('/api/admin/github-site-manager/flash-train');
  };

  const handleGenerateGameplan = async () => {
    await runStream('/api/admin/github-site-manager/gameplan');
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">🖥️ GitHub Site Manager</h1>

      <input
        type="text"
        placeholder="Project Repo SSH URL"
        value={projectRepo}
        onChange={(e) => setProjectRepo(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="Site Repo SSH URL"
        value={siteRepo}
        onChange={(e) => setSiteRepo(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div className="space-x-2">
        <button
          onClick={handleFlashTrain}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          ⚡ Flash Training
        </button>

        <button
          onClick={handleGenerateGameplan}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          🧠 Generate Gameplan
        </button>
      </div>

      <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
        {loading ? 'Loading...\n\n' : ''}
        {output}
      </pre>
    </main>
  );
}
