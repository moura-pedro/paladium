'use client';

import { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  placeholder?: string;
  className?: string;
}

interface BookedDate {
  from: string;
  to: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  placeholder = 'Select date',
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState(value);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle clicking outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate array of dates in a range
  const getDatesInRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    
    while (current < end) { // Use < instead of <= to exclude the end date
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Check if a date is disabled
  const isDateDisabled = (dateStr: string): boolean => {
    // Check if date is before min date
    if (minDate && dateStr < minDate) return true;
    
    // Check if date is after max date
    if (maxDate && dateStr > maxDate) return true;
    
    // Check if date is in disabled dates array
    return disabledDates.includes(dateStr);
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const isCurrentMonth = current.getMonth() === month;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === value;
      const isDisabled = isDateDisabled(dateStr);
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (dateStr: string, isDisabled: boolean) => {
    if (!isDisabled) {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate the date
    if (newValue && !isDateDisabled(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const navigateMonth = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatInputValue = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const days = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Input Field */}
      <input
        type="text"
        value={formatInputValue(inputValue)}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none cursor-pointer"
        readOnly
      />

      {/* Calendar Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 bg-background border border-foreground/10 rounded-xl shadow-lg z-50 p-4 w-80"
          onClick={handleCalendarClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={(e) => navigateMonth('prev', e)}
              className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={(e) => navigateMonth('next', e)}
              className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-xs font-medium text-center py-2 text-foreground/50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => handleDateClick(day.dateStr, day.isDisabled)}
                disabled={day.isDisabled}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                  ${day.isCurrentMonth ? 'text-foreground' : 'text-foreground/30'}
                  ${day.isToday ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
                  ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                  ${day.isDisabled 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 cursor-not-allowed opacity-60 line-through' 
                    : 'hover:bg-foreground/10 cursor-pointer'
                  }
                  ${!day.isCurrentMonth && !day.isDisabled ? 'hover:bg-foreground/5' : ''}
                `}
                title={day.isDisabled ? 'This date is unavailable' : ''}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-4 pt-3 border-t border-foreground/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const today = new Date().toISOString().split('T')[0];
                if (!isDateDisabled(today)) {
                  onChange(today);
                  setIsOpen(false);
                }
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isDateDisabled(new Date().toISOString().split('T')[0])}
            >
              Today
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setIsOpen(false);
              }}
              className="text-sm text-foreground/60 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
