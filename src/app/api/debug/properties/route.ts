import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';

/**
 * Diagnostic endpoint to check what properties exist in the database
 * Visit: http://localhost:3000/api/debug/properties
 */
export async function GET() {
  try {
    await dbConnect();
    
    const totalCount = await Property.countDocuments();
    const properties = await Property.find({}).lean();
    
    const propertyList = properties.map((p, index) => ({
      index: index + 1,
      id: p._id.toString(),
      title: p.title,
      location: typeof p.location === 'string' ? p.location : `${p.location.city}, ${p.location.state}`,
      price: p.price,
      maxGuests: p.maxGuests,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      imageCount: p.images?.length || 0,
    }));
    
    return NextResponse.json({
      success: true,
      totalCount,
      properties: propertyList,
      message: totalCount === 0 
        ? 'No properties found. Add properties at /host/dashboard/add'
        : `Found ${totalCount} properties`
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

