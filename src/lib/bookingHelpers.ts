import Booking from './models/Booking';
import Property from './models/Property';
import mongoose from 'mongoose';

/**
 * Check if a property is available for the given date range
 * @param propertyId - The property to check
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @param excludeBookingId - Optional booking ID to exclude (for updates)
 * @param session - Optional MongoDB session for transactions
 * @returns Object with availability status and conflicting bookings if any
 */
export async function checkPropertyAvailability(
  propertyId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string,
  session?: mongoose.ClientSession
) {
  // Verify property exists
  const query = Property.findById(propertyId);
  const property = session ? await query.session(session) : await query;
  
  if (!property) {
    return {
      available: false,
      error: 'Property not found',
    };
  }

  // Build query for overlapping bookings
  const bookingQuery: any = {
    propertyId: propertyId,
    status: { $nin: ['cancelled'] },
    $and: [
      { from: { $lt: endDate } },
      { to: { $gt: startDate } }
    ]
  };

  // Exclude a specific booking (useful for updates)
  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId };
  }

  const query2 = Booking.find(bookingQuery);
  const overlappingBookings = session 
    ? await query2.session(session) 
    : await query2;

  if (overlappingBookings.length > 0) {
    return {
      available: false,
      conflictingBookings: overlappingBookings.map(b => ({
        id: b._id.toString(),
        from: b.from,
        to: b.to,
        status: b.status,
      })),
    };
  }

  return {
    available: true,
  };
}

/**
 * Validate booking dates
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Object with validation result and error message if invalid
 */
export function validateBookingDates(startDate: Date, endDate: Date) {
  const now = new Date();
  
  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)',
    };
  }

  // Check if start is before end
  if (startDate >= endDate) {
    return {
      valid: false,
      error: 'Check-out date must be after check-in date',
    };
  }

  // Check if start is in the past
  if (startDate < now) {
    return {
      valid: false,
      error: 'Check-in date cannot be in the past',
    };
  }

  // Maximum booking duration (365 days)
  const maxDuration = 365 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > maxDuration) {
    return {
      valid: false,
      error: 'Booking duration cannot exceed 365 days',
    };
  }

  // Minimum booking duration (1 day)
  const minDuration = 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() < minDuration) {
    return {
      valid: false,
      error: 'Booking duration must be at least 1 day',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Calculate the number of nights for a booking
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Number of nights
 */
export function calculateNights(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate total price for a booking
 * @param pricePerNight - Property price per night
 * @param startDate - Check-in date
 * @param endDate - Check-out date
 * @returns Total price
 */
export function calculateTotalPrice(
  pricePerNight: number,
  startDate: Date,
  endDate: Date
): number {
  const nights = calculateNights(startDate, endDate);
  return nights * pricePerNight;
}

