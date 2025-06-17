import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import SourcesClient from './sources-client';

export const metadata: Metadata = {
  title: 'Stock Sources',
  description: 'Compare Rule 1 vs Magic Formula stocks',
};

export default function SourcesPage({
  searchParams,
}: {
  searchParams?: {
    date?: string;
  };
}) {
  const initialDate = searchParams?.date || '';

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Stock Sources</h1>
      </div>
      <SourcesClient initialDate={initialDate} />
    </div>
  );
}