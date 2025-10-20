import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';
import User, { IUser } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hostId, title, description, location, price, maxGuests, bedrooms, bathrooms, amenities, images } = await req.json();

    await dbConnect();

    // Verify the user is a host
    const user = await User.findOne({ clerkId: userId }) as IUser | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'host') {
      return NextResponse.json({ error: 'Only hosts can create properties' }, { status: 403 });
    }

    if (user._id.toString() !== hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create the property
    const property = await Property.create({
      hostId,
      title,
      description,
      location,
      price,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities: amenities || [],
      images: images || [],
    });

    return NextResponse.json({
      success: true,
      property: {
        id: property._id,
        title: property.title,
      },
    });
  } catch (error) {
    console.error('Property creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const maxPrice = searchParams.get('maxPrice');
    const minGuests = searchParams.get('minGuests');

    const query: any = {};

    if (location) {
      // Parse location search - split by comma to handle "City, State" format
      const locationParts = location.split(',').map(part => part.trim());
      
      const orConditions: any[] = [
        { location: { $regex: location, $options: 'i' } }, // Legacy string format
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

    if (maxPrice) {
      query.price = { $lte: Number(maxPrice) };
    }

    if (minGuests) {
      query.maxGuests = { $gte: Number(minGuests) };
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

