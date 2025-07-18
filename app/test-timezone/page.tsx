import TimezoneTest from '@/app/ui/timezone-test';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Timezone Debug Page</h1>
        <TimezoneTest />
      </div>
    </div>
  );
}