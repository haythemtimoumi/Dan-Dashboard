import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteStock } from '@/app/lib/actions';

export function CreateStock() {
  return (
    <Link
      href="/dashboard/stocks/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shadow-sm"
    >
      <span className="hidden md:block">Add Stock</span>{' '}
      <PlusIcon className="h-5 w-5 md:ml-2" />
    </Link>
  );
}

export function UpdateStock({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/stocks/${id}/edit`}
      className="rounded-md border border-gray-200 p-2 hover:bg-gray-100 transition-colors flex items-center justify-center"
      aria-label="Edit stock"
    >
      <PencilIcon className="w-4 h-4 text-gray-500" />
    </Link>
  );
}

export function DeleteStock({ id }: { id: string }) {
  const deleteStockWithId = deleteStock.bind(null, id);
  
  return (
    <form action={deleteStockWithId}>
      <button 
        className="rounded-md border border-gray-200 p-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center"
        aria-label="Delete stock"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4 h-4" />
      </button>
    </form>
  );
}