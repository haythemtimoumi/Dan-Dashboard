import { Suspense } from 'react';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import RecentChangesClient from './recent-changes-client';
import { RecentChangesSkeleton } from '@/app/ui/skeletons';

export const metadata: Metadata = {
  title: "Recent Stock Changes",
  description: "Track significant changes in stock metrics over time"
};

export default async function RecentChangesPage() {
  return (
    <main>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold`}>
          Recent Stock Changes
        </h1>
        <p className="mt-2 opacity-90 max-w-3xl">
          Track significant changes in stock metrics between two dates. Identify trends and opportunities with powerful filtering options.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Trend Analysis
          </div>
        </div>
      </div>
      <Suspense fallback={<RecentChangesSkeleton />}>
        <RecentChangesClient />
      </Suspense>
    </main>
  );
}