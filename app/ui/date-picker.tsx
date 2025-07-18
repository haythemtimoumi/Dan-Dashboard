'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css';
import { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import { useSettings } from '@/app/contexts/settings-context';

// Register French locale for multilingual support
registerLocale('fr', fr);

interface DatePickerInputProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function DatePickerInput({
  selectedDate,
  onChange,
  placeholder = 'Select date...'
}: DatePickerInputProps) {
  const { language } = useSettings();
  
  // Handle date selection with timezone consistency
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange(null);
      return;
    }
    
    // Create a UTC date at noon to avoid timezone day shifting
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    onChange(utcDate);
  };
  
  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="MM/dd/yyyy"
        placeholderText={placeholder}
        className="block w-full rounded-lg backdrop-blur-md bg-blue-900/30 border border-blue-400/30 py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-blue-300 focus:border-blue-400/50 focus:bg-blue-900/40 focus:outline-none transition-all duration-300"
        wrapperClassName="w-full"
        locale={language === 'fr' ? 'fr' : undefined}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-5 w-5 text-blue-300"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}