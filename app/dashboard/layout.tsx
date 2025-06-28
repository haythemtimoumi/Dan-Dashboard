import SideNav from '@/app/ui/dashboard/sidenav';
 
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-50">
      <div className="w-full flex-none md:w-72">
        <SideNav />
      </div>
      <div className="flex-grow p-4 md:overflow-y-auto md:p-8 lg:p-10 xl:p-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        <footer className="mt-12 text-center text-sm text-gray-500 pb-6">
          <p>© {new Date().getFullYear()} Dan Dashboard. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}