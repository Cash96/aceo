'use client'

import React from 'react';

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
    <main style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Trigger Initial Training</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Object.entries(departmentConfig).map(([key]) => (
          <button
            key={key}
            onClick={() => handleTrain(key as keyof typeof departmentConfig)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
            }}
          >
            Train {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
    </main>
  )
}
