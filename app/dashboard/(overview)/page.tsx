import { Metadata } from 'next';
import StockChangesExpertView from '@/app/ui/dashboard/StockChangesExpertView';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Stock Metric Changes Overview"
};

export default function DashboardPage() {
  return (
    <main className="space-y-8 px-4 py-6">
      <StockChangesExpertView />
    </main>
  );
}
