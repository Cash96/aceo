'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const departmentLabels: Record<string, string> = {
  hr: 'HR',
  marketing: 'Marketing',
  field_operations: 'Field Ops',
  franchise_sales: 'Franchise Sales',
  products_and_programs: 'Products & Programs',
  legal: 'Legal',
};

export default function DepartmentChatPage() {
  const { department } = useParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log('📥 Loaded department chat page');
    if (typeof department === 'string') {
      console.log(`🔍 Department param: ${department}`);
    }
  }, [department]);

  if (!department || typeof department !== 'string' || !departmentLabels[department]) {
    console.warn('❌ Invalid department route param:', department);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">❌ Invalid Department</h1>
        <button
          onClick={() => {
            console.log('🔙 Returning to department selector');
            router.push('/chat');
          }}
          className="mt-4 text-blue-500 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) {
      console.log('⚠️ Empty message, skipping send.');
      return;
    }

    console.log(`📨 Sending message to /api/chat/stream for ${department}`);
    setLoading(true);
    setResponse('');
    controllerRef.current = new AbortController();

    try {
      console.log('📤 Awaiting response from server...');
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ message, department }),
        signal: controllerRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`❌ Failed to fetch stream: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      console.log('📡 Starting to read stream...');
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('📴 Stream ended from server.');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📩 Received chunk:', chunk);

        fullResponse += chunk;
        setResponse((prev) => {
          const next = prev + chunk;
          console.log('🖨️ Updated UI with:', next);
          return next;
        });
      }

      console.log('✅ Full assistant response:', fullResponse);
    } catch (err) {
      if (controllerRef.current?.signal.aborted) {
        console.warn('🛑 Request was aborted by the user.');
      } else {
        console.error('❌ Fetch error:', err);
        setResponse('There was an error. Please try again.');
      }
    }

    setLoading(false);
    console.log('✅ Message handling complete');
  };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-4">
        💬 Chat with {departmentLabels[department]}
      </h1>

      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={4}
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>

      <div className="mt-6 p-4 border rounded bg-gray-100 dark:bg-gray-900 min-h-[100px] whitespace-pre-wrap">
        {response}
        {loading && <span className="animate-pulse">|</span>}
      </div>
    </div>
  );
}
