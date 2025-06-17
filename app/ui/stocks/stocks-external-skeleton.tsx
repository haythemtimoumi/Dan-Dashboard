import { CalendarIcon } from '@heroicons/react/24/outline';

export function StocksExternalSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-4 md:pt-4 shadow-md">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Date filter skeleton */}
          <div className="mb-6 px-2 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-1">
                <div className="flex items-center gap-1 mb-1">
                  <CalendarIcon className="h-4 w-4 text-gray-300" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="col-span-1">
                <div className="flex items-center gap-1 mb-1">
                  <CalendarIcon className="h-4 w-4 text-gray-300" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="col-span-1 flex items-end gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="mt-3 h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="hidden md:block">
            <div className="h-12 bg-gray-200 rounded-t animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse mt-1"></div>
            ))}
          </div>
          
          {/* Mobile skeleton */}
          <div className="md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-3 w-full h-40 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}