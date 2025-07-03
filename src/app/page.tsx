'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 space-y-12 bg-white dark:bg-black text-black dark:text-white">
      <header className="flex flex-col items-center space-y-2">
        <h1 className="text-3xl font-bold">ACEO Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage all training, assistants, and open-web learning
        </p>
      </header>

      <main className="flex flex-col sm:flex-row flex-wrap gap-6 justify-center">
        <button
          onClick={() => router.push('/chat')}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-lg shadow-md"
        >
          💬 Chat with Department
        </button>
        <button
          onClick={() => router.push('/training')}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg shadow-md"
        >
          📥 Train New Data
        </button>
        <button
          onClick={() => router.push('/admin/reset-training')}
          className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg shadow-md"
        >
          🧹 Flush Training Data
        </button>
        <button
          onClick={() => router.push('/tracking')}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-lg shadow-md"
        >
          📊 Open-Web Learning Tracker
        </button>
      </main>

      <footer className="pt-10 text-sm text-gray-400">
        Powered by Next.js & OpenAI · v1.0
      </footer>
    </div>
  );
}
