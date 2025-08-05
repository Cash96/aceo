'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

const departmentLabels: Record<string, string> = {
  hr: 'HR',
  marketing: 'Marketing',
  field_operations: 'Field Ops',
  franchise_sales: 'Franchise Sales',
  products_and_programs: 'Products & Programs',
  legal: 'Legal',
}

export default function DepartmentChatPage() {
  const { department } = useParams()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (typeof department === 'string') {
      console.log(`📥 Loaded department chat page: ${department}`)
    }
  }, [department])

  // Handle invalid department
  if (!department || typeof department !== 'string' || !departmentLabels[department]) {
    return (
      <main className="min-h-screen bg-[#E1FFFF] flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">❌ Invalid Department</h1>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 text-white bg-[#4141FF] hover:bg-[#00003D] focus:outline-none focus:ring-2 focus:ring-[#FFE45E] rounded-md"
          >
            Go Back
          </button>
        </div>
      </main>
    )
  }

  const handleSend = async () => {
    if (!message.trim()) return

    setLoading(true)
    setResponse('')
    controllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ message, department }),
        signal: controllerRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Failed to fetch stream: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setResponse((prev) => prev + chunk)
      }
    } catch (err) {
      if (!controllerRef.current?.signal.aborted) {
        setResponse('There was an error. Please try again.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#E1FFFF] text-black flex flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-2xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8 flex flex-col">
        
        {/* Header */}
        <h1 className="text-2xl font-semibold text-[#00003D] mb-6 text-center">
          💬 Chat with {departmentLabels[department]}
        </h1>

        {/* Message Input */}
        <textarea
          className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#4141FF] mb-4"
          rows={4}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="self-end px-6 py-3 bg-[#4141FF] hover:bg-[#00003D] text-white rounded-md font-medium 
                     disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFE45E]"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>

        {/* Response Area */}
        <div className="mt-6 p-4 border border-[#00003D]/20 rounded-md bg-[#E1FFFF] min-h-[120px] whitespace-pre-wrap">
          {response}
          {loading && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </main>
  )
}
