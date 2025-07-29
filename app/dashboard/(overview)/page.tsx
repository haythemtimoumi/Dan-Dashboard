import { Metadata } from 'next';
import DashboardAnalytics from '@/app/ui/dashboard/DashboardAnalytics';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Stock Analytics Dashboard"
};

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <DashboardAnalytics />
    </main>
  );
}
