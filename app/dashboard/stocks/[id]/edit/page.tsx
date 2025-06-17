import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import EditStockForm from '@/app/ui/stocks/edit-form';
import { fetchStockById } from '@/app/lib/data';

export const metadata: Metadata = {
  title: 'Edit Stock',
  description: 'Edit an existing stock',
};

export default async function EditStockPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const stock = await fetchStockById(id);

  if (!stock) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Edit Stock</h1>
      </div>
      <div className="mt-4">
        <EditStockForm stock={stock} />
      </div>
    </div>
  );
}