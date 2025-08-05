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
        setVisits(data.visits || []); // ✅ Default to [] if undefined
      } catch (err) {
        console.error('❌ Failed to fetch site visits:', err);
        setVisits([]); // ✅ fallback
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
    ? Array.from(new Set(visits.map((v) => v.rootDomain))).length
    : 0;

  return (
    <main className="min-h-screen bg-[#E1FFFF] text-black px-8 py-12 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-[#00003D] mb-2">
            📊 Open-Web Learning Tracker
          </h1>
          <p className="text-sm text-black">
            Track your learning journey and STEAM-Score
          </p>
        </header>

        {/* Stats */}
        <section className="mb-6 space-y-1">
          <div>
            <span className="text-lg font-semibold text-[#00003D]">
              🎯 Current STEAM-Score:{' '}
            </span>
            <span className="text-xl text-emerald-600">{steamScore}</span>
          </div>
          <div>
            <span className="text-lg font-semibold text-[#00003D]">
              🌐 Unique Sites Visited:{' '}
            </span>
            <span className="text-xl">{uniqueDomains}</span>
          </div>
        </section>

        {/* Data Table */}
        {loading ? (
          <p className="text-[#00003D]">Loading site visits…</p>
        ) : visits.length === 0 ? (
          <p className="text-[#00003D]">No site visits recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-[#00003D]/20 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#4141FF] text-white">
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
                    className="border-b border-[#00003D]/20 hover:bg-[#E1FFFF]"
                  >
                    <td className="px-3 py-2">
                      {new Date(visit.accessedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{visit.rootDomain}</td>
                    <td className="px-3 py-2">
                      {visit.genTitle || visit.rawTitle}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded bg-[#FFE45E] text-black">
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
    </main>
  );
}
