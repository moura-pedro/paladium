import dbConnect from '../../db';
import Property from '../../models/Property';
import Booking from '../../models/Booking';
import { formatLocation } from '../../locationHelpers';

export interface SearchPropertiesParams {
  location?: string;
  maxPrice?: number;
  minGuests?: number;
  checkIn?: string;
  checkOut?: string;
}

/**
 * Search for properties with availability filtering
 */
export async function searchProperties(params: SearchPropertiesParams) {
  await dbConnect();

  const query: any = {};

  if (params.location) {
    // Parse location search - split by comma to handle "City, State" format
    const locationParts = params.location.split(',').map(part => part.trim());
    
    const orConditions: any[] = [
      { location: { $regex: params.location, $options: 'i' } }, // Legacy string format
    ];
    
    // Add conditions for each part of the location
    locationParts.forEach(part => {
      if (part) {
        orConditions.push(
          { 'location.city': { $regex: part, $options: 'i' } },
          { 'location.state': { $regex: part, $options: 'i' } },
          { 'location.stateCode': { $regex: part, $options: 'i' } },
          { 'location.country': { $regex: part, $options: 'i' } },
          { 'location.countryCode': { $regex: part, $options: 'i' } }
        );
      }
    });
    
    query.$or = orConditions;
  }

  if (params.maxPrice) {
    query.price = { $lte: params.maxPrice };
  }

  if (params.minGuests) {
    query.maxGuests = { $gte: params.minGuests };
  }

  console.log('Search query:', JSON.stringify(query, null, 2));
  console.log('Search params:', params);

  let properties = await Property.find(query).limit(10).lean();
  
  console.log(`Found ${properties.length} properties before availability filtering`);

  // If dates are provided, filter out properties with conflicting bookings
  if (params.checkIn && params.checkOut) {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    const availableProperties = [];

    for (const property of properties) {
      const conflictingBooking = await Booking.findOne({
        propertyId: property._id,
        status: { $nin: ['cancelled'] },
        $or: [
          { from: { $lte: checkInDate }, to: { $gt: checkInDate } },
          { from: { $lt: checkOutDate }, to: { $gte: checkOutDate } },
          { from: { $gte: checkInDate }, to: { $lte: checkOutDate } },
        ],
      });

      if (!conflictingBooking) {
        availableProperties.push(property);
      }
    }

    properties = availableProperties;
  }

  const results = properties.map((p, index) => ({
    propertyId: p._id.toString(), // Primary field name for clarity
    id: p._id.toString(), // Keep for backward compatibility
    index: index + 1,
    title: p.title,
    description: p.description,
    location: formatLocation(p.location),
    price: p.price,
    maxGuests: p.maxGuests,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    amenities: p.amenities,
    images: p.images || [], // Include images for display
  }));
  
  console.log('✓ Returning search results:');
  results.forEach(r => {
    console.log(`  ${r.index}. ${r.title} (ID: ${r.propertyId})`);
  });
  
  return results;
}

/**
 * Get detailed information about a specific property
 */
export async function getPropertyDetails(propertyId: string) {
  await dbConnect();

  const property = await Property.findById(propertyId).populate('hostId').lean();

  if (!property) {
    throw new Error('Property not found');
  }

  return {
    id: property._id.toString(),
    title: property.title,
    description: property.description,
    location: formatLocation(property.location),
    price: property.price,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    amenities: property.amenities,
    images: property.images,
  };
}

