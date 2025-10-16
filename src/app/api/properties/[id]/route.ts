import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Property, { IProperty } from '@/lib/models/Property';
import User, { IUser } from '@/lib/models/User';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET a single property
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    const property = await Property.findById(id).lean();
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE a property
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    await dbConnect();

    // Verify the user is a host
    const user = await User.findOne({ clerkId: userId }) as IUser | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'host') {
      return NextResponse.json({ error: 'Only hosts can update properties' }, { status: 403 });
    }

    // Find the property and verify ownership
    const property = await Property.findById(id) as IProperty | null;

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.hostId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You can only edit your own properties' }, { status: 403 });
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        title: updates.title,
        description: updates.description,
        location: updates.location,
        price: updates.price,
        maxGuests: updates.maxGuests,
        bedrooms: updates.bedrooms,
        bathrooms: updates.bathrooms,
        amenities: updates.amenities || [],
        images: updates.images || [],
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      property: {
        id: updatedProperty!._id,
        title: updatedProperty!.title,
      },
    });
  } catch (error) {
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a property
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Verify the user is a host
    const user = await User.findOne({ clerkId: userId }) as IUser | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'host') {
      return NextResponse.json({ error: 'Only hosts can delete properties' }, { status: 403 });
    }

    // Find the property and verify ownership
    const property = await Property.findById(id) as IProperty | null;

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.hostId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You can only delete your own properties' }, { status: 403 });
    }

    // Delete the property
    await Property.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Property delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

