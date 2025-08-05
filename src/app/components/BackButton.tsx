'use client'
import { useRouter } from 'next/navigation'

export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="px-4 py-2 bg-white hover:bg-gray-100 rounded-md 
                 text-gray-800 text-sm font-medium border border-gray-300"
    >
      ← {label}
    </button>
  )
}
