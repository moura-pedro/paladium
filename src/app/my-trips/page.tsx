import Link from 'next/link';
import Image from 'next/image';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Booking from '@/lib/models/Booking';
import Property from '@/lib/models/Property';
import User from '@/lib/models/User';
import { UserButton } from '@clerk/nextjs';
import { formatLocation } from '@/lib/locationHelpers';

// Helper to format date without timezone conversion
function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  return new Date(year, month, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default async function MyTripsPage() {
  const user = await requireAuth();

  // Only guests should see this page
  if (user.role === 'host') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Hosts don't have trips</h1>
          <p className="text-foreground/70 mb-6">
            As a host, you can view bookings for your properties on each property page.
          </p>
          <Link
            href="/host/dashboard"
            className="inline-block bg-foreground text-background px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  await dbConnect();
  
  const dbUser = await User.findOne({ clerkId: user.clerkId });
  
  // Get all bookings for this guest, populate property details
  const bookings = await Booking.find({ guestId: dbUser!._id })
    .populate('propertyId')
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();

  // Categorize bookings
  const upcomingBookings = bookings.filter(b => 
    new Date(b.from) > now && b.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(b => 
    new Date(b.to) <= now || b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold">
              Paladium
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
              >
                🤖 AI Assistant
              </Link>
              <UserButton afterSwitchSessionUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Trips</h1>
          <p className="text-foreground/70">All your bookings in one place</p>
        </div>

        {bookings.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-semibold mb-2">No trips yet</h2>
            <p className="text-foreground/70 mb-6">
              Start exploring amazing properties
            </p>
            <Link
              href="/"
              className="inline-block bg-foreground text-background px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Trips */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Trips</h2>
                <div className="grid gap-4">
                  {upcomingBookings.map((booking: any) => (
                    <BookingCard key={booking._id.toString()} booking={booking} upcoming />
                  ))}
                </div>
              </div>
            )}

            {/* Past Trips */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Past Trips</h2>
                <div className="grid gap-4">
                  {pastBookings.map((booking: any) => (
                    <BookingCard key={booking._id.toString()} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, upcoming = false }: { booking: any; upcoming?: boolean }) {
  const property = booking.propertyId;
  const from = new Date(booking.from);
  const to = new Date(booking.to);
  const nights = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  const statusColors = {
    confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="glass rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform">
      <div className="grid md:grid-cols-[200px_1fr] gap-4">
        {/* Property Image */}
        <div className="aspect-[4/3] md:aspect-square relative bg-foreground/5">
          {property?.images?.[0] ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🏠
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-semibold mb-1">
                {property?.title || 'Property not available'}
              </h3>
              <p className="text-sm text-foreground/70">
                📍 {property?.location ? formatLocation(property.location) : 'Location not available'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status as keyof typeof statusColors]}`}>
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-foreground/50 mb-1">Check-in</div>
              <div className="font-semibold">
                {formatDateOnly(from)}
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground/50 mb-1">Check-out</div>
              <div className="font-semibold">
                {formatDateOnly(to)}
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground/50 mb-1">Nights</div>
              <div className="font-semibold">{nights}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/50 mb-1">Total</div>
              <div className="font-semibold">${booking.totalPrice}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/property/${property?._id?.toString() || ''}`}
              className="flex-1 text-center glass-light px-4 py-2 rounded-lg text-sm hover:scale-[1.02] transition-transform"
            >
              View Property
            </Link>
            {upcoming && booking.status === 'confirmed' && (
              <button
                className="px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

