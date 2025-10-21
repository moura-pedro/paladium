import dbConnect from '../../db';
import Property from '../../models/Property';
import Booking, { IBooking } from '../../models/Booking';
import { formatLocation } from '../../locationHelpers';

export interface BookingParams {
  propertyId: string;
  checkIn: string;
  checkOut: string;
}

export interface ConfirmBookingParams extends BookingParams {
  guestId: string;
}

/**
 * Validate that a property ID is in the correct MongoDB ObjectId format
 */
function validatePropertyId(propertyId: string): void {
  if (!propertyId || !/^[0-9a-fA-F]{24}$/.test(propertyId)) {
    throw new Error(
      `Invalid property ID format. Property IDs must be 24-character hexadecimal strings (e.g., "68f13bd6ad824083a9a5a63b"), but received: "${propertyId}". Please search for properties first and use the exact "id" field from the search results.`
    );
  }
}

/**
 * Validate that a booking ID is in the correct MongoDB ObjectId format
 */
function validateBookingId(bookingId: string): void {
  if (!bookingId || !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
    throw new Error(
      `Invalid booking ID format. Booking IDs must be 24-character hexadecimal strings (e.g., "68f1277a77560bae4b881b6e"), but received: "${bookingId}". Please use get_my_bookings to retrieve valid booking IDs.`
    );
  }
}

/**
 * Calculate the number of nights between two dates
 */
function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Check if property is available for the given dates
 */
async function checkAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const conflictingBooking = await Booking.findOne({
    propertyId,
    status: { $nin: ['cancelled'] },
    $or: [
      { from: { $lte: checkIn }, to: { $gt: checkIn } },
      { from: { $lt: checkOut }, to: { $gte: checkOut } },
      { from: { $gte: checkIn }, to: { $lte: checkOut } },
    ],
  });

  return !conflictingBooking;
}

/**
 * Prepare a booking by calculating price and returning a summary
 * This should always be called before confirm_booking to show the user the cost
 */
export async function prepareBooking(params: BookingParams) {
  await dbConnect();

  console.log('prepareBooking called with params:', params);
  console.log('prepareBooking propertyId type:', typeof params.propertyId);
  console.log('prepareBooking propertyId length:', params.propertyId?.length);

  validatePropertyId(params.propertyId);

  console.log('prepareBooking searching for property with ID:', params.propertyId);
  
  // Debug: Check all properties in the database
  const allProperties = await Property.find({}).limit(5).lean();
  console.log(`Total properties in DB check: ${allProperties.length} (showing first 5)`);
  allProperties.forEach(p => {
    console.log(`  - ${p.title} (ID: ${p._id.toString()})`);
  });
  
  const property = await Property.findById(params.propertyId);

  console.log('Property found:', property ? property.title : 'NOT FOUND');
  console.log('Property ID in DB:', property ? property._id.toString() : 'N/A');

  if (!property) {
    // Provide helpful error message with available properties
    const availableCount = await Property.countDocuments();
    throw new Error(
      `Property not found. The property ID "${params.propertyId}" does not exist in the database. ` +
      `There are ${availableCount} properties available. Please search for properties first using search_properties.`
    );
  }

  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);

  // Validate dates
  if (checkInDate >= checkOutDate) {
    throw new Error('Check-out date must be after check-in date');
  }

  // Check if date is in the past (with tolerance for same day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    throw new Error('Check-in date cannot be in the past');
  }

  // Check for conflicts
  const isAvailable = await checkAvailability(
    params.propertyId,
    checkInDate,
    checkOutDate
  );

  if (!isAvailable) {
    throw new Error('This property is already booked for the selected dates');
  }

  const nights = calculateNights(checkInDate, checkOutDate);
  const totalPrice = nights * property.price;

  return {
    property: {
      id: property._id.toString(),
      title: property.title,
      location: formatLocation(property.location),
      pricePerNight: property.price,
    },
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    totalPrice,
    message: `Ready to book ${property.title} for ${nights} night(s) at $${totalPrice} total. Please confirm to proceed.`,
  };
}

/**
 * Confirm and create the actual booking
 * Should only be called after prepare_booking and user confirmation
 */
export async function confirmBooking(params: ConfirmBookingParams) {
  await dbConnect();

  console.log('confirmBooking called with propertyId:', params.propertyId);
  console.log('propertyId type:', typeof params.propertyId);
  console.log('propertyId length:', params.propertyId?.length);

  validatePropertyId(params.propertyId);

  console.log('Searching for property with ID:', params.propertyId);
  const property = await Property.findById(params.propertyId);

  console.log('Property found:', property ? property.title : 'NOT FOUND');
  console.log('Property found (full):', property ? JSON.stringify({ id: property._id, title: property.title }) : 'NOT FOUND');

  if (!property) {
    throw new Error('Property not found');
  }

  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);

  // Double-check for conflicts
  const isAvailable = await checkAvailability(
    params.propertyId,
    checkInDate,
    checkOutDate
  );

  if (!isAvailable) {
    throw new Error('This property is no longer available for the selected dates');
  }

  const nights = calculateNights(checkInDate, checkOutDate);
  const totalPrice = nights * property.price;

  const booking = (await Booking.create({
    propertyId: params.propertyId,
    guestId: params.guestId,
    from: checkInDate,
    to: checkOutDate,
    totalPrice,
    status: 'confirmed',
  })) as IBooking;

  return {
    success: true,
    bookingId: booking._id.toString(),
    property: property.title,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    totalPrice,
    message: `Booking confirmed! Your reservation ID is ${booking._id.toString()}. You'll stay at ${property.title} from ${params.checkIn} to ${params.checkOut}.`,
  };
}

/**
 * Get user's bookings with optional status filter
 * By default, excludes cancelled bookings unless status is 'all'
 */
export async function getMyBookings(
  userId: string,
  status?: 'upcoming' | 'past' | 'all'
) {
  await dbConnect();

  const query: any = { guestId: userId };

  // Default behavior: exclude cancelled bookings unless explicitly requesting 'all'
  if (status !== 'all') {
    query.status = { $nin: ['cancelled'] };
  }

  if (status === 'upcoming') {
    query.from = { $gte: new Date() };
  } else if (status === 'past') {
    query.to = { $lt: new Date() };
  } else if (!status || status === 'all') {
    // For default (no status) or 'all', show active bookings sorted by date
    // 'all' will include cancelled because we skip the filter above
    // No status defaults to active bookings only (already filtered above)
  }

  let bookings = await Booking.find(query)
    .populate('propertyId')
    .lean();

  const now = new Date();
  
  // Split bookings into upcoming and past
  const upcomingBookings = bookings.filter((b: any) => new Date(b.from) >= now);
  const pastBookings = bookings.filter((b: any) => new Date(b.from) < now);
  
  // Sort upcoming (soonest first) and past (most recent first)
  upcomingBookings.sort((a: any, b: any) => new Date(a.from).getTime() - new Date(b.from).getTime());
  pastBookings.sort((a: any, b: any) => new Date(b.from).getTime() - new Date(a.from).getTime());
  
  // Combine: upcoming first, then past
  const sortedBookings = [...upcomingBookings, ...pastBookings];

  const results = sortedBookings.map((b: any) => ({
    bookingId: b._id.toString(), // Primary field name for clarity
    id: b._id.toString(), // Keep for backward compatibility
    property: {
      id: b.propertyId._id.toString(),
      title: b.propertyId.title,
      location: formatLocation(b.propertyId.location),
      images: b.propertyId.images || [], // Include images for card display
    },
    // Format dates using UTC to avoid timezone issues
    checkIn: `${b.from.getUTCFullYear()}-${String(b.from.getUTCMonth() + 1).padStart(2, '0')}-${String(b.from.getUTCDate()).padStart(2, '0')}`,
    checkOut: `${b.to.getUTCFullYear()}-${String(b.to.getUTCMonth() + 1).padStart(2, '0')}-${String(b.to.getUTCDate()).padStart(2, '0')}`,
    totalPrice: b.totalPrice,
    status: b.status,
  }));
  
  console.log('✓ Returning user bookings:');
  results.forEach(r => {
    console.log(`  - ${r.property.title} (Booking ID: ${r.bookingId}) - ${r.checkIn} to ${r.checkOut} [${r.status}]`);
  });
  
  return results;
}

/**
 * Cancel a booking by ID
 */
export async function cancelBooking(bookingId: string, userId: string) {
  await dbConnect();

  console.log('cancelBooking called with bookingId:', bookingId);

  validateBookingId(bookingId);

  const booking = await Booking.findById(bookingId).populate('propertyId');

  console.log('Booking found:', booking ? `${(booking.propertyId as any)?.title} (${booking.status})` : 'NOT FOUND');

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verify the booking belongs to the user
  if (booking.guestId.toString() !== userId) {
    throw new Error('You can only cancel your own bookings');
  }

  if (booking.status === 'cancelled') {
    throw new Error('This booking is already cancelled');
  }

  booking.status = 'cancelled';
  await booking.save();

  // Return the updated booking data so UI can show the cancelled status
  const property = booking.propertyId as any;
  return {
    success: true,
    message: `Booking cancelled successfully. Your reservation for ${property.title} has been cancelled.`,
    booking: {
      bookingId: booking._id.toString(),
      id: booking._id.toString(),
      property: {
        id: property._id.toString(),
        title: property.title,
        location: formatLocation(property.location),
        images: property.images || [],
      },
      checkIn: `${booking.from.getUTCFullYear()}-${String(booking.from.getUTCMonth() + 1).padStart(2, '0')}-${String(booking.from.getUTCDate()).padStart(2, '0')}`,
      checkOut: `${booking.to.getUTCFullYear()}-${String(booking.to.getUTCMonth() + 1).padStart(2, '0')}-${String(booking.to.getUTCDate()).padStart(2, '0')}`,
      totalPrice: booking.totalPrice,
      status: 'cancelled',
    },
  };
}

