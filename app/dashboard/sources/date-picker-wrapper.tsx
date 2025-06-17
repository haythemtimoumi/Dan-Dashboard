'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DatePickerInput from '@/app/ui/date-picker';
import { Button } from '@/app/ui/button';

export default function DatePickerWrapper({ 
  onApply,
  initialDate
}: { 
  onApply: (date: Date | null) => void;
  initialDate?: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );

 const handleApply = () => {
  onApply(selectedDate);
  if (selectedDate) {
    // Format as MM/DD/YYYY for the API
    const formattedDate = `${(selectedDate.getMonth()+1).toString().padStart(2,'0')}/${selectedDate.getDate().toString().padStart(2,'0')}/${selectedDate.getFullYear()}`;
    router.push(`/dashboard/sources?date=${formattedDate}`);
  } else {
    router.push('/dashboard/sources');
  }
};

  const clearDate = () => {
    setSelectedDate(null);
    onApply(null);
    router.push('/dashboard/sources');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="w-full sm:w-64">
        <DatePickerInput
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          placeholder="Select a date..."
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleApply}>
          Apply Filter
        </Button>
        {initialDate && (
          <Button onClick={clearDate} className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}