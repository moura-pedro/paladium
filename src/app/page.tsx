import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';
import { UserButton } from '@clerk/nextjs';
import { formatLocation } from '@/lib/locationHelpers';

export default async function HomePage() {
  const user = await getCurrentUser();
  
  await dbConnect();
  const properties = await Property.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

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
              {user && !user.needsOnboarding && (
                <>
                  <Link
                    href="/chat"
                    className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
                  >
                    🤖 AI Assistant
                  </Link>
                  
                  {user.role === 'host' ? (
                    <Link
                      href="/host/dashboard"
                      className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
                    >
                      My Properties
                    </Link>
                  ) : (
                    <Link
                      href="/my-trips"
                      className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
                    >
                      My Trips
                    </Link>
                  )}
                </>
              )}
              
              {user ? (
                <UserButton afterSwitchSessionUrl="/" />
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/sign-in"
                    className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-foreground/70 mb-8">
            Book amazing properties with AI-powered assistance
          </p>
          
          {user && !user.needsOnboarding && (
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 glass px-8 py-4 rounded-full text-lg font-medium hover:scale-[1.02] transition-transform"
            >
              <span>🎙️</span>
              Try voice booking
            </Link>
          )}
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-foreground/50">
                No properties available yet. Check back soon!
              </p>
            </div>
          ) : (
            properties.map((property: any) => (
              <Link
                key={property._id.toString()}
                href={`/property/${property._id.toString()}`}
                className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform"
              >
                <div className="aspect-[4/3] relative bg-foreground/5">
                  {property.images?.[0] ? (
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
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                  <p className="text-sm text-foreground/70 mb-2">{formatLocation(property.location)}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      ${property.price}
                      <span className="text-sm font-normal text-foreground/70">/night</span>
                    </span>
                    <span className="text-sm text-foreground/70">
                      {property.bedrooms} bed · {property.bathrooms} bath
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
