'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/DatePicker';

interface Props {
  propertyId: string;
  pricePerNight: number;
  userId: string;
}

interface BookedDate {
  from: string;
  to: string;
}

export default function BookingForm({ propertyId, pricePerNight, userId }: Props) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const router = useRouter();

  // Fetch booked dates when component mounts
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/bookings`);
        if (response.ok) {
          const data = await response.json();
          setBookedDates(data.bookings || []);
        }
      } catch (err) {
        console.error('Error fetching booked dates:', err);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchBookedDates();
  }, [propertyId]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  // Convert booked dates to disabled dates array
  const getDisabledDates = (): string[] => {
    const disabledDates: string[] = [];
    
    bookedDates.forEach(booking => {
      const start = new Date(booking.from);
      const end = new Date(booking.to);
      
      // Use UTC dates to avoid timezone issues
      const current = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate()
      ));
      const endUTC = new Date(Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate()
      ));
      
      // Add all dates in the booking range
      while (current < endUTC) {
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, '0');
        const day = String(current.getUTCDate()).padStart(2, '0');
        disabledDates.push(`${year}-${month}-${day}`);
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });
    
    return disabledDates;
  };

  // Check if selected dates overlap with any booked dates
  const checkDateOverlap = () => {
    if (!checkIn || !checkOut) return null;
    
    // Use date strings directly for comparison (YYYY-MM-DD format)
    for (const booking of bookedDates) {
      const bookedStart = new Date(booking.from);
      const bookedEnd = new Date(booking.to);
      const selectedStart = new Date(checkIn);
      const selectedEnd = new Date(checkOut);

      // Normalize to UTC dates for comparison
      const bookedStartUTC = Date.UTC(bookedStart.getUTCFullYear(), bookedStart.getUTCMonth(), bookedStart.getUTCDate());
      const bookedEndUTC = Date.UTC(bookedEnd.getUTCFullYear(), bookedEnd.getUTCMonth(), bookedEnd.getUTCDate());
      const selectedStartUTC = Date.UTC(selectedStart.getUTCFullYear(), selectedStart.getUTCMonth(), selectedStart.getUTCDate());
      const selectedEndUTC = Date.UTC(selectedEnd.getUTCFullYear(), selectedEnd.getUTCMonth(), selectedEnd.getUTCDate());

      // Check if dates overlap
      if (selectedStartUTC < bookedEndUTC && selectedEndUTC > bookedStartUTC) {
        return booking;
      }
    }

    return null;
  };

  const nights = calculateNights();
  const totalPrice = nights * pricePerNight;
  const overlappingBooking = checkDateOverlap();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }

    if (nights <= 0) {
      setError('Check-out must be after check-in');
      return;
    }

    // Check for overlap before submitting
    if (overlappingBooking) {
      const from = new Date(overlappingBooking.from).toLocaleDateString();
      const to = new Date(overlappingBooking.to).toLocaleDateString();
      setError(`These dates overlap with an existing booking (${from} - ${to}). Please choose different dates.`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          guestId: userId,
          from: new Date(checkIn),
          to: new Date(checkOut),
          totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('🎉 Booking confirmed! Check your email for details.');
        router.push('/');
      } else {
        setError(data.error || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date without timezone conversion
  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Booked Dates Info */}
      {!loadingDates && bookedDates.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
            ℹ️ Unavailable dates are shown in red on the calendar
          </div>
          <div className="text-xs text-foreground/60">
            {bookedDates.length} booking{bookedDates.length !== 1 ? 's' : ''} currently active
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Check-in</label>
        <DatePicker
          value={checkIn}
          onChange={setCheckIn}
          minDate={today}
          disabledDates={getDisabledDates()}
          placeholder="Select check-in date"
          className={overlappingBooking ? 'ring-2 ring-red-500/50' : ''}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Check-out</label>
        <DatePicker
          value={checkOut}
          onChange={setCheckOut}
          minDate={checkIn || today}
          disabledDates={getDisabledDates()}
          placeholder="Select check-out date"
          className={overlappingBooking ? 'ring-2 ring-red-500/50' : ''}
        />
      </div>

      {/* Overlap Warning */}
      {overlappingBooking && checkIn && checkOut && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="text-sm text-red-600 dark:text-red-400">
            ⚠️ These dates overlap with an existing booking. Please choose different dates.
          </div>
        </div>
      )}

      {nights > 0 && (
        <div className="glass-light rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-foreground/70">${pricePerNight} × {nights} nights</span>
            <span>${pricePerNight * nights}</span>
          </div>
          <div className="border-t border-foreground/10 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || nights <= 0 || !!overlappingBooking}
        className="w-full bg-foreground text-background py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Booking...' : overlappingBooking ? 'Dates Unavailable' : 'Reserve'}
      </button>

      <p className="text-xs text-center text-foreground/50">
        You won't be charged yet
      </p>
    </form>
  );
}

