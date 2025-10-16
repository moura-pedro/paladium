import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Booking, { IBooking } from '@/lib/models/Booking';
import User, { IUser } from '@/lib/models/User';
import Property from '@/lib/models/Property';

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, guestId, from, to, totalPrice } = await req.json();

    // Validate required fields
    if (!propertyId || !guestId || !from || !to || totalPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, guestId, from, to, totalPrice' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Parse and validate dates
    const startDate = new Date(from);
    const endDate = new Date(to);
    const now = new Date();

    // Date validation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (startDate < now) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      );
    }

    // Maximum booking duration check (e.g., 365 days)
    const maxDuration = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxDuration) {
      return NextResponse.json(
        { error: 'Booking duration cannot exceed 365 days' },
        { status: 400 }
      );
    }

    // Start transaction
    session.startTransaction();

    // Verify the user is a guest
    const user = await User.findOne({ clerkId: userId }).session(session) as IUser | null;
    
    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'guest') {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Only guests can make bookings' }, { status: 403 });
    }

    if (user._id.toString() !== guestId) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify property exists
    const property = await Property.findById(propertyId).session(session);
    if (!property) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check for overlapping bookings
    // Logic: Overlap occurs when startDate < requestedEnd && endDate > requestedStart
    const overlappingBookings = await Booking.find({
      propertyId: propertyId,
      status: { $nin: ['cancelled'] }, // Exclude cancelled bookings
      $and: [
        { from: { $lt: endDate } },     // Existing booking starts before requested end
        { to: { $gt: startDate } }      // Existing booking ends after requested start
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      await session.abortTransaction();
      
      // Return details about the conflict
      const conflictDetails = overlappingBookings.map(b => ({
        from: b.from,
        to: b.to
      }));

      return NextResponse.json({
        error: 'This property is already booked for the selected dates',
        conflictingBookings: conflictDetails
      }, { status: 409 });
    }

    // Create the booking within transaction
    const booking = await Booking.create([{
      propertyId,
      guestId,
      from: startDate,
      to: endDate,
      totalPrice,
      status: 'confirmed',
    }], { session });

    // Commit transaction
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      booking: {
        id: booking[0]._id,
        propertyId: booking[0].propertyId,
        from: booking[0].from,
        to: booking[0].to,
        totalPrice: booking[0].totalPrice,
        status: booking[0].status,
      },
    });
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();
    console.error('Booking error:', error);
    
    // Check if it's a conflict error from our pre-save hook
    if (error.message?.includes('already booked')) {
      return NextResponse.json(
        { error: 'This property is already booked for the selected dates' },
        { status: 409 }
      );
    }

    if (error.message?.includes('Check-in date')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  } finally {
    // End session
    session.endSession();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ clerkId: userId }) as IUser | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get bookings for the user
    const bookings = await Booking.find({ guestId: user._id })
      .populate('propertyId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

