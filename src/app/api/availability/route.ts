import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { checkPropertyAvailability, validateBookingDates } from '@/lib/bookingHelpers';

/**
 * Check property availability for given dates
 * GET /api/availability?propertyId=xxx&from=2024-01-01&to=2024-01-05
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate required parameters
    if (!propertyId || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: propertyId, from, to' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Parse dates
    const startDate = new Date(from);
    const endDate = new Date(to);

    // Validate dates
    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Check availability
    const availabilityCheck = await checkPropertyAvailability(
      propertyId,
      startDate,
      endDate
    );

    if (!availabilityCheck.available) {
      if (availabilityCheck.error) {
        return NextResponse.json(
          { error: availabilityCheck.error },
          { status: 404 }
        );
      }

      return NextResponse.json({
        available: false,
        message: 'Property is not available for the selected dates',
        conflictingBookings: availabilityCheck.conflictingBookings,
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Property is available for the selected dates',
      propertyId,
      from: startDate,
      to: endDate,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Bulk availability check for multiple date ranges
 * POST /api/availability
 */
export async function POST(req: NextRequest) {
  try {
    const { propertyId, dateRanges } = await req.json();

    if (!propertyId || !Array.isArray(dateRanges) || dateRanges.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId and dateRanges array' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check availability for each date range
    const results = await Promise.all(
      dateRanges.map(async (range: { from: string; to: string }) => {
        const startDate = new Date(range.from);
        const endDate = new Date(range.to);

        // Validate dates
        const dateValidation = validateBookingDates(startDate, endDate);
        if (!dateValidation.valid) {
          return {
            from: range.from,
            to: range.to,
            available: false,
            error: dateValidation.error,
          };
        }

        // Check availability
        const availabilityCheck = await checkPropertyAvailability(
          propertyId,
          startDate,
          endDate
        );

        return {
          from: range.from,
          to: range.to,
          available: availabilityCheck.available,
          conflictingBookings: availabilityCheck.conflictingBookings,
          error: availabilityCheck.error,
        };
      })
    );

    return NextResponse.json({
      propertyId,
      results,
    });
  } catch (error) {
    console.error('Bulk availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

