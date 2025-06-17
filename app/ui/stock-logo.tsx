import { lusitana } from '@/app/ui/fonts';

export function StockLogo() {
  return (
    <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
      <p className="text-[24px] ml-2">Stock Analysis</p>
    </div>
  );
}