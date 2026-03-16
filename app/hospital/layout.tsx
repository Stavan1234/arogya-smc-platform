'use client';

import Link from 'next/link';

interface HospitalLayoutProps {
  children: React.ReactNode;
}

export default function HospitalLayout({ children }: HospitalLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-green-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Hospital Portal</h2>
        <nav>
          <ul className="space-y-2">
            <li><Link href="/hospital" className="block p-2 hover:bg-green-700 rounded">Dashboard</Link></li>
            <li><Link href="/hospital/report/new" className="block p-2 hover:bg-green-700 rounded">New Report</Link></li>
            <li><Link href="/hospital/history" className="block p-2 hover:bg-green-700 rounded">History</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}