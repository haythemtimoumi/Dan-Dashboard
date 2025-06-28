import { Metadata } from 'next';
import StockChangesExpertView from '@/app/ui/dashboard/StockChangesExpertView';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Stock Metric Changes Overview"
};

export default function DashboardPage() {
  return (
    <main className="space-y-8">
      <StockChangesExpertView />
    </main>
  );
}
