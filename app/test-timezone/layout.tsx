import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Timezone Fix Test',
  description: 'Test page for verifying timezone fixes',
};

export default function TestTimezoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-100 min-h-screen">
      {children}
    </div>
  );
}