'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8 py-12 bg-[#E1FFFF]">
      {/* Card Container */}
      <div className="w-full max-w-3xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-10 flex flex-col items-center">
        
        {/* Header */}
        <header className="flex flex-col items-center space-y-2 mb-8">
          <h1 className="text-3xl font-semibold text-[#00003D]">
            ACEO Admin Dashboard
          </h1>
          <p className="text-sm text-black text-center max-w-md">
            Manage all training, assistants, and open-web learning
          </p>
        </header>

        {/* Main Buttons */}
        <section className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center w-full">
          <button
            onClick={() => router.push('/chat')}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium text-white 
                       bg-[#4141FF] hover:bg-[#00003D] focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                       rounded-md shadow-sm transition-colors duration-200"
          >
            💬 Chat with Department
          </button>

          <button
            onClick={() => router.push('/training')}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium text-white 
                       bg-[#4141FF] hover:bg-[#00003D] focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                       rounded-md shadow-sm transition-colors duration-200"
          >
            📥 Train New Data
          </button>

          <button
            onClick={() => router.push('/admin/reset-training')}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium text-black 
                       bg-[#FFE45E] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-[#00003D]
                       rounded-md shadow-sm transition-colors duration-200"
          >
            🧹 Flush Training Data
          </button>

          <button
            onClick={() => router.push('/tracking')}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium text-white 
                       bg-[#4141FF] hover:bg-[#00003D] focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                       rounded-md shadow-sm transition-colors duration-200"
          >
            📊 Open-Web Learning Tracker
          </button>
        </section>

        {/* Footer */}
        <footer className="pt-8 mt-8 border-t border-[#00003D]/20 text-xs text-[#000000]">
          LOL Not School Stack (I wish)
        </footer>
      </div>
    </main>
  )
}
