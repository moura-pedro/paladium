import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/lib/models/Booking';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/properties/[id]/bookings
 * Fetch all confirmed bookings for a property (for date blocking)
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await dbConnect();

    // Get all non-cancelled bookings for this property
    const bookings = await Booking.find({
      propertyId: id,
      status: { $nin: ['cancelled'] },
      to: { $gte: new Date() }, // Only future and current bookings
    })
      .select('from to status')
      .sort({ from: 1 })
      .lean();

    return NextResponse.json({
      bookings: bookings.map(b => ({
        from: b.from.toISOString().split('T')[0],
        to: b.to.toISOString().split('T')[0],
        status: b.status,
      })),
    });
  } catch (error) {
    console.error('Get property bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

