import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';
import User from '@/lib/models/User';
import Booking from '@/lib/models/Booking';
import BookingForm from './BookingForm';
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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  await dbConnect();
  
  const property = await Property.findById(id).lean();
  
  if (!property) {
    notFound();
  }

  const host = await User.findById(property.hostId).lean();
  
  // Check if current user is the host
  const isHost = user && !user.needsOnboarding && user.role === 'host' && 
    host && user.clerkId === host.clerkId;

  // Get bookings if user is the host
  let bookings: any[] = [];
  if (isHost) {
    bookings = await Booking.find({ propertyId: id })
      .populate('guestId')
      .sort({ from: 1 })
      .lean();
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold">
              ← Paladium
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            {/* Images */}
            <div className="glass rounded-2xl overflow-hidden mb-6">
              <div className="aspect-[16/9] relative bg-foreground/5">
                {property.images?.[0] ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🏠
                  </div>
                )}
              </div>
              
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-2">
                  {property.images.slice(1, 5).map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square relative rounded-lg overflow-hidden">
                      <Image src={img} alt={`${property.title} ${idx + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="glass rounded-2xl p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <p className="text-foreground/70 mb-4">📍 {formatLocation(property.location)}</p>
              
              <div className="flex gap-6 mb-6 pb-6 border-b border-foreground/10">
                <div>
                  <div className="font-semibold">{property.maxGuests}</div>
                  <div className="text-sm text-foreground/70">Guests</div>
                </div>
                <div>
                  <div className="font-semibold">{property.bedrooms}</div>
                  <div className="text-sm text-foreground/70">Bedrooms</div>
                </div>
                <div>
                  <div className="font-semibold">{property.bathrooms}</div>
                  <div className="text-sm text-foreground/70">Bathrooms</div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="font-semibold text-lg mb-2">About this place</h2>
                <p className="text-foreground/80">{property.description}</p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span>✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Host Info */}
            {host && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-3">Hosted by {host.name}</h2>
                <p className="text-sm text-foreground/70">
                  Member since {new Date(host.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Bookings (Host Only) */}
            {isHost && (
              <div className="glass rounded-2xl p-6 mt-6">
                <h2 className="font-semibold text-lg mb-4">Bookings for this Property</h2>
                {bookings.length === 0 ? (
                  <p className="text-foreground/70 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking: any) => {
                      const from = new Date(booking.from);
                      const to = new Date(booking.to);
                      const nights = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
                      const guest = booking.guestId;
                      const isPast = to < new Date();

                      return (
                        <div 
                          key={booking._id.toString()} 
                          className={`glass-light rounded-xl p-4 ${isPast ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">{guest?.name || 'Guest'}</div>
                              <div className="text-xs text-foreground/50">{guest?.email}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                : booking.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-foreground/50">Check-in</div>
                              <div className="font-medium">{formatDateOnly(from)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-foreground/50">Check-out</div>
                              <div className="font-medium">{formatDateOnly(to)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-foreground/50">Total</div>
                              <div className="font-medium">${booking.totalPrice} ({nights} {nights === 1 ? 'night' : 'nights'})</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-3xl font-bold">
                  ${property.price}
                  <span className="text-lg font-normal text-foreground/70">/night</span>
                </div>
              </div>

              {user && !user.needsOnboarding && user.role === 'guest' ? (
                <BookingForm
                  propertyId={property._id.toString()}
                  pricePerNight={property.price}
                  userId={user.id}
                />
              ) : user && user.role === 'host' ? (
                <div className="text-center py-4">
                  <p className="text-foreground/70 mb-4">
                    Switch to a guest account to book properties
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Link
                    href="/sign-in"
                    className="block w-full bg-foreground text-background py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Sign in to book
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

