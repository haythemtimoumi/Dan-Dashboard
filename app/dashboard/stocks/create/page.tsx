import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import Form from '@/app/ui/stocks/create-form';

export const metadata: Metadata = {
  title: 'Create Stock',
  description: 'Add a new stock to the system',
};

export default async function CreateStockPage() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Create Stock</h1>
      </div>
      <div className="mt-4">
        <Form />
      </div>
    </div>
  );
}