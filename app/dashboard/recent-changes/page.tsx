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
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Recent Stock Changes
      </h1>
      <p className="mb-4 text-gray-500">
        Track significant changes in stock metrics between two dates. Filter by ticker, source, guru, and set a minimum threshold for changes.
      </p>
      <Suspense fallback={<RecentChangesSkeleton />}>
        <RecentChangesClient />
      </Suspense>
    </main>
  );
}