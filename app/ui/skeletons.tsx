// Loading animation
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

export function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <LatestStocksSkeleton />
        <DailyChangesSkeleton />
      </div>
    </>
  );
}

export function CardSkeleton() {
  return (
    <div
      className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 p-2 shadow-sm`}
    >
      <div className="flex p-4">
        <div className="h-5 w-5 rounded-md bg-gray-200" />
        <div className="ml-2 h-6 w-16 rounded-md bg-gray-200 text-sm font-medium" />
      </div>
      <div className="flex items-center justify-center truncate rounded-xl bg-white px-4 py-8">
        <div className="h-7 w-20 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </>
  );
}

export function LatestStocksSkeleton() {
  return (
    <div
      className={`${shimmer} relative flex w-full flex-col overflow-hidden md:col-span-4`}
    >
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-100" />
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-100 p-4">
        <div className="bg-white px-6">
          <StockSkeleton />
          <StockSkeleton />
          <StockSkeleton />
        </div>
        <div className="flex items-center pb-2 pt-6">
          <div className="h-5 w-5 rounded-full bg-gray-200" />
          <div className="ml-2 h-4 w-20 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function DailyChangesSkeleton() {
  return (
    <div
      className={`${shimmer} relative flex w-full flex-col overflow-hidden md:col-span-4`}
    >
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-100" />
      <div className="rounded-xl bg-gray-100 p-4">
        <div className="h-80 w-full bg-white rounded-md"></div>
      </div>
    </div>
  );
}

export function StockSkeleton() {
  return (
    <div className="flex flex-row items-center justify-between py-4">
      <div className="flex items-center">
        <div className="h-5 w-16 rounded-md bg-gray-200" />
      </div>
      <div className="h-5 w-10 rounded-md bg-gray-200" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="w-full border-b border-gray-100 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
      {/* Ticker */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </td>
      {/* Sentiment Score */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-14 rounded bg-gray-100"></div>
      </td>
      {/* Signal Score */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-14 rounded bg-gray-100"></div>
      </td>
      {/* PE */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-10 rounded bg-gray-100"></div>
      </td>
      {/* Buy Price */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </td>
      {/* Guru */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-20 rounded bg-gray-100"></div>
      </td>
      {/* Source */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-24 rounded bg-gray-100"></div>
      </td>
      {/* Actions */}
      <td className="whitespace-nowrap px-3 py-3">
        <div className="flex justify-end gap-3">
          <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
          <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
        </div>
      </td>
    </tr>
  );
}

export function StocksMobileSkeleton() {
  return (
    <div className="mb-2 w-full rounded-md bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 rounded-full bg-gray-100"></div>
          <div className="h-6 w-16 rounded bg-gray-100"></div>
        </div>
        <div className="h-6 w-16 rounded bg-gray-100"></div>
      </div>
      <div className="flex w-full items-center justify-between pt-4">
        <div>
          <div className="h-6 w-16 rounded bg-gray-100"></div>
          <div className="mt-2 h-6 w-24 rounded bg-gray-100"></div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-10 w-10 rounded bg-gray-100"></div>
          <div className="h-10 w-10 rounded bg-gray-100"></div>
        </div>
      </div>
    </div>
  );
}

export function StocksTableSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            <StocksMobileSkeleton />
            <StocksMobileSkeleton />
            <StocksMobileSkeleton />
            <StocksMobileSkeleton />
            <StocksMobileSkeleton />
            <StocksMobileSkeleton />
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ticker
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Sentiment
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Signal
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  PE
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Buy Price
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Guru
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Source
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div
      className={`${shimmer} relative flex w-full flex-col overflow-hidden rounded-xl bg-gray-100 p-4`}
    >
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-200" />
      <div className="flex-1 space-y-4 rounded-xl bg-white p-8">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="mt-6 h-10 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function InvoicesTableSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            <div className="mb-2 w-full rounded-md bg-white p-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center">
                  <div className="mr-2 h-8 w-8 rounded-full bg-gray-100"></div>
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </div>
                <div className="h-6 w-16 rounded bg-gray-100"></div>
              </div>
              <div className="flex w-full items-center justify-between pt-4">
                <div>
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                  <div className="mt-2 h-6 w-24 rounded bg-gray-100"></div>
                </div>
                <div className="flex justify-end gap-2">
                  <div className="h-10 w-10 rounded bg-gray-100"></div>
                  <div className="h-10 w-10 rounded bg-gray-100"></div>
                </div>
              </div>
            </div>
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Status
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                    <div className="h-6 w-24 rounded bg-gray-100"></div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-32 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                  <div className="flex justify-end gap-3">
                    <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
                    <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
                  </div>
                </td>
              </tr>
              <tr className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                    <div className="h-6 w-24 rounded bg-gray-100"></div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-32 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="h-6 w-16 rounded bg-gray-100"></div>
                </td>
                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                  <div className="flex justify-end gap-3">
                    <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
                    <div className="h-[38px] w-[38px] rounded bg-gray-100"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;

export function RecentChangesSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden`}>
      {/* Form skeleton */}
      <div className="mb-8 rounded-md bg-gray-100 p-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-gray-200"></div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <div className="h-10 w-32 rounded-md bg-gray-200"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array(8).fill(0).map((_, i) => (
                <th key={i} scope="col" className="px-6 py-3 text-left">
                  <div className="h-4 w-20 rounded-md bg-gray-200"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array(5).fill(0).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array(8).fill(0).map((_, colIndex) => (
                  <td key={colIndex} className="whitespace-nowrap px-6 py-4">
                    <div className="h-5 w-20 rounded-md bg-gray-200"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}