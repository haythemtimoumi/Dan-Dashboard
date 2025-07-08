import SideNav from '@/app/ui/dashboard/sidenav';
 
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-50">
      <div className="w-full flex-none md:w-72">
        <SideNav />
      </div>
      <div className="flex-grow p-2 md:overflow-y-auto md:p-4">
        <div className="max-w-none">
          {children}
        </div>
        <footer className="mt-6 text-center text-xs text-gray-400 pb-4">
          <p>© {new Date().getFullYear()} Dan Dashboard</p>
        </footer>
      </div>
    </div>
  );
}