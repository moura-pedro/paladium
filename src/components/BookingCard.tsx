'use client';

import Image from 'next/image';
import { useState } from 'react';

export interface BookingCardData {
  bookingId: string;
  property: {
    id: string;
    title: string;
    location: string;
    images?: string[];
  };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  nights?: number;
}

interface BookingCardProps {
  booking: BookingCardData;
  onCancel?: (bookingId: string) => void;
}

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [isCanceling, setIsCanceling] = useState(false);
  
  const mainImage = booking.property.images && booking.property.images.length > 0 
    ? booking.property.images[0] 
    : null;

  // Parse date strings without timezone conversion issues
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };
  
  const checkInDate = parseDate(booking.checkIn);
  const checkOutDate = parseDate(booking.checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Format dates without timezone conversion
  const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Status styling
  const getStatusStyle = () => {
    switch (booking.status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-foreground/20 text-foreground/70 border-foreground/30';
    }
  };

  const handleCancelClick = async () => {
    if (onCancel && booking.status.toLowerCase() === 'confirmed') {
      const confirmed = confirm('Are you sure you want to cancel this booking?');
      if (confirmed) {
        setIsCanceling(true);
        await onCancel(booking.bookingId);
        setIsCanceling(false);
      }
    }
  };

  return (
    <div className="glass overflow-hidden rounded-2xl shadow-lg hover:scale-[1.01] transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative w-full md:w-48 h-48 md:h-auto bg-gradient-to-br from-foreground/10 to-foreground/5 flex-shrink-0">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={booking.property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle()}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 md:p-5">
          <div className="flex flex-col h-full">
            {/* Property Info */}
            <div className="mb-3">
              <h3 className="text-xl font-bold mb-1">{booking.property.title}</h3>
              <p className="text-sm text-foreground/60 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {booking.property.location}
              </p>
            </div>

            {/* Date Info */}
            <div className="flex flex-wrap gap-4 mb-3 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-foreground/50 text-xs">Check-in</div>
                  <div className="font-semibold">{formatDate(booking.checkIn)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-foreground/50 text-xs">Check-out</div>
                  <div className="font-semibold">{formatDate(booking.checkOut)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-foreground/50 text-xs">Duration</div>
                  <div className="font-semibold">{nights} night{nights !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Footer with Price and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-foreground/10 mt-auto">
              <div>
                <div className="text-foreground/50 text-xs mb-1">Total Price</div>
                <div className="text-2xl font-bold">${booking.totalPrice}</div>
              </div>

              {booking.status.toLowerCase() === 'confirmed' && onCancel && (
                <button
                  onClick={handleCancelClick}
                  disabled={isCanceling}
                  className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {isCanceling ? 'Canceling...' : 'Cancel Booking'}
                </button>
              )}
            </div>

            {/* Booking ID */}
            <div className="mt-2 text-xs text-foreground/40">
              Booking ID: {booking.bookingId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

