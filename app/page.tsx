import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl w-full px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Arogya<span className="text-blue-600">-SMC</span> Platform
          </h1>
          <p className="text-lg text-gray-600">
            Solapur Municipal Corporation Health Management System
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gov / Medical Officer Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Gov / Medical Officer</h2>
              <p className="text-gray-600 mb-8 min-h-[48px]">
                Access the central dashboard for surveillance, capacity tracking, and analytics.
              </p>
              <Link href="/login" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Login as Officer
              </Link>
            </div>
          </div>

          {/* Hospital Portal Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="p-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Hospital Portal</h2>
              <p className="text-gray-600 mb-8 min-h-[48px]">
                Register your facility, update bed capacity, and manage medical inventory.
              </p>
              <div className="space-y-3">
                <Link href="/hospital/login" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Login to Portal
                </Link>
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">New facility? </span>
                  <Link href="/hospital/register" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    Register Hospital
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}