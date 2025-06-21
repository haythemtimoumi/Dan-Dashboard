import { Metadata } from 'next';
import StockChangesView from '@/app/ui/dashboard/StockChangesView';

export const metadata: Metadata = {
  title: "Stock Changes",
  description: "Metric comparison and analysis dashboard"
};

export default function DashboardPage() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Recent Stock Metric Changes</h1>
      <StockChangesView />
    </main>
  );
}
