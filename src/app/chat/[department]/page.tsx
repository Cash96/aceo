'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

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

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const controllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle invalid department
  if (!department || typeof department !== 'string' || !departmentLabels[department]) {
    return (
      <main className="min-h-screen bg-[#E1FFFF] flex flex-col items-center justify-center px-[20%] py-12">
        <div className="w-full bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8 text-center">
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

  // Send message to API
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    controllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ message: input, department }),
        signal: controllerRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Failed to fetch stream: ${res.status}`)

      // Placeholder AI message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk
          }
          return updated
        })
      }
    } catch (err) {
      if (!controllerRef.current?.signal.aborted) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'There was an error. Please try again.' }])
      }
    }

    setLoading(false)
  }

  return (
    <main className="relative min-h-screen bg-[#E1FFFF] text-black flex flex-col px-[20%]">

      {/* Hover Back Button */}
      <div className="absolute top-0 left-0 w-full h-[30px] group z-20">
        <button
          onClick={() => router.push('/chat')}
          className={`
  absolute top-2 left-4 px-4 py-2 bg-[#4141FF] text-white rounded-md text-sm font-medium
  opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300
`}
        >
          ← Back
        </button>
      </div>

      {/* Header */}
      <header className="p-4 bg-white border-b border-[#00003D]/20 text-center font-semibold text-[#00003D]">
        💬 Chat with {departmentLabels[department]}
      </header>

      {/* {Chat Messages} */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1
          const animationClass =
            msg.role === 'user'
              ? isLast ? 'opacity-0 translate-y-8 animate-[fadeUp_0.5s_ease-out_forwards]' : ''
              : isLast ? 'opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]' : ''

          return (
            <div
              key={idx}
              className={`max-w-[80%] p-3 rounded-lg transition-all duration-500 ease-out
                ${animationClass}
                ${msg.role === 'user'
                  ? 'bg-[#4141FF] text-white self-end ml-auto'
                  : 'bg-white border border-[#00003D]/20 text-black'}`}
            >
              {msg.content}
              {loading && isLast && msg.role === 'assistant' && (
                <span className="animate-pulse">|</span>
              )}
            </div>
          )
        })}

        {/* Loading dots without border/background */}
        {loading && (
          <div className="max-w-[80%] bg-transparent text-black flex items-start">
            <span className="flex space-x-1 mt-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
            </span>
          </div>
        )}


        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 w-full px-[20%] bg-white border-t border-[#00003D]/20 flex space-x-2 p-4">
        <textarea
          rows={1}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="flex-1 border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#4141FF]"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-[#4141FF] hover:bg-[#00003D] text-white rounded-md disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </main>
  )
}

// TODO:
// fix the 3 dots position so they align where the chat output will be
// add markdown processing