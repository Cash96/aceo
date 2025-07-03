'use client';

import { useEffect, useState } from 'react';

interface SiteVisit {
  _id: string;
  url: string;
  rootDomain: string;
  accessedAt: string;
  timeOnSite: number;
  rawTitle: string;
  genTitle: string;
  genDescription: string;
  genSubject: string;
}

export default function TrackingPage() {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/tracking/records');
        const data = await res.json();
        setVisits(data.visits || []);  // ✅ Default to [] if undefined
      } catch (err) {
        console.error('❌ Failed to fetch site visits:', err);
        setVisits([]);  // ✅ fallback
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  const steamScore = visits?.reduce(
    (score, visit) => score + (visit?.timeOnSite || 0),
    0
  );

  const uniqueDomains = visits
    ? Array.from(new Set(visits.map(v => v.rootDomain))).length
    : 0;

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-black text-black dark:text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Open-Web Learning Tracker</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track your learning journey and STEAM-Score
        </p>
      </header>

      <section className="mb-4 space-y-1">
        <div>
          <span className="text-lg font-semibold">🎯 Current STEAM-Score: </span>
          <span className="text-xl text-emerald-600">{steamScore}</span>
        </div>
        <div>
          <span className="text-lg font-semibold">🌐 Unique Sites Visited: </span>
          <span className="text-xl">{uniqueDomains}</span>
        </div>
      </section>

      {loading ? (
        <p>Loading site visits…</p>
      ) : visits.length === 0 ? (
        <p>No site visits recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr
                  key={visit._id}
                  className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-3 py-2">
                    {new Date(visit.accessedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{visit.rootDomain}</td>
                  <td className="px-3 py-2">{visit.genTitle || visit.rawTitle}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                      {visit.genSubject || 'N/A'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{visit.timeOnSite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
