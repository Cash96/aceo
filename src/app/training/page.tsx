'use client'

import React from 'react'
import { departmentConfig } from '@/config/training'

export default function TrainingPage() {
  const handleTrain = async (departmentKey: keyof typeof departmentConfig) => {
    const dept = departmentConfig[departmentKey]

    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: departmentKey,
          folderId: dept.folderId,
          vectorStoreId: dept.vectorStoreId,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      alert(`${departmentKey} training triggered successfully`)
    } catch (err) {
      console.error('❌ Training failed:', err)
      alert(`Failed to trigger training for ${departmentKey}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#E1FFFF] px-8 py-12 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-[#00003D] mb-6 text-center">
          Trigger Initial Training
        </h1>

        <div className="flex flex-col gap-3">
          {Object.entries(departmentConfig).map(([key]) => (
            <button
              key={key}
              onClick={() => handleTrain(key as keyof typeof departmentConfig)}
              className="w-full px-6 py-3 text-base font-medium text-white 
                         bg-[#4141FF] hover:bg-[#00003D] 
                         focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                         rounded-md border border-transparent 
                         transition-colors duration-200"
            >
              Train {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
