'use client';

import { useRouter } from 'next/navigation';

const departments = [
  'hr',
  'marketing',
  'field_operations',
  'franchise_sales',
  'products_and_programs',
  'legal',
];

const departmentLabels: Record<string, string> = {
  hr: 'HR',
  marketing: 'Marketing',
  field_operations: 'Field Ops',
  franchise_sales: 'Franchise Sales',
  products_and_programs: 'Products & Programs',
  legal: 'Legal',
};

export default function ChatSelectorPage() {
  const router = useRouter();

  const handleDepartmentClick = (dept: string) => {
    console.log(`🔁 Navigating to /chat/${dept}`);
    router.push(`/chat/${dept}`);
  };

  console.log('🧠 ChatSelectorPage rendered');

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-6">🧠 Select a Department to Chat With</h1>

      <ul className="space-y-4">
        {departments.map((dept) => (
          <li key={dept}>
            <button
              onClick={() => handleDepartmentClick(dept)}
              className="text-lg text-blue-600 hover:underline"
            >
              {departmentLabels[dept]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
