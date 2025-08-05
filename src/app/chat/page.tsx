'use client'

import { useRouter } from 'next/navigation'

const departments = [
  'hr',
  'marketing',
  'field_operations',
  'franchise_sales',
  'products_and_programs',
  'legal',
]

const departmentLabels: Record<string, string> = {
  hr: 'HR',
  marketing: 'Marketing',
  field_operations: 'Field Ops',
  franchise_sales: 'Franchise Sales',
  products_and_programs: 'Products & Programs',
  legal: 'Legal',
}

export default function ChatSelectorPage() {
  const router = useRouter()

  const handleDepartmentClick = (dept: string) => {
    console.log(`🔁 Navigating to /chat/${dept}`)
    router.push(`/chat/${dept}`)
  }

  return (
    <main className="min-h-screen bg-[#E1FFFF] text-black flex flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-2xl bg-white border border-[#00003D]/20 shadow-sm rounded-lg p-8 flex flex-col">
        
        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-[#00003D] mb-6 text-center">
          🧠 Select a Department to Chat With
        </h1>

        {/* Department List */}
        <ul className="flex flex-col gap-3">
          {departments.map((dept) => (
            <li key={dept}>
              <button
                onClick={() => handleDepartmentClick(dept)}
                className="w-full px-6 py-3 text-base font-medium text-white 
                           bg-[#4141FF] hover:bg-[#00003D] focus:outline-none focus:ring-2 focus:ring-[#FFE45E]
                           rounded-md shadow-sm transition-colors duration-200"
              >
                {departmentLabels[dept]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
