'use client';

import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-blue-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">SMC Command Centre</h2>
        <nav>
          <ul className="space-y-2">
            <li><Link href="/dashboard" className="block p-2 hover:bg-blue-700 rounded">Overview</Link></li>
            <li><Link href="/dashboard/wards" className="block p-2 hover:bg-blue-700 rounded">Wards</Link></li>
            <li><Link href="/dashboard/facilities" className="block p-2 hover:bg-blue-700 rounded">Facilities</Link></li>
            <li><Link href="/dashboard/alerts" className="block p-2 hover:bg-blue-700 rounded">Alerts</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}