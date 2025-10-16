import Link from 'next/link';
import Image from 'next/image';
import { requireHost } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';
import User from '@/lib/models/User';
import { UserButton } from '@clerk/nextjs';

export default async function HostDashboard() {
  const user = await requireHost();

  await dbConnect();
  
  const dbUser = await User.findOne({ clerkId: user.clerkId });
  const properties = await Property.find({ hostId: dbUser!._id })
    .sort({ createdAt: -1 })
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
              <Link
                href="/host/dashboard/add"
                className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                + Add Property
              </Link>
              <UserButton afterSwitchSessionUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Properties</h1>
          <p className="text-foreground/70">Manage your listings</p>
        </div>

        {properties.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-semibold mb-2">No properties yet</h2>
            <p className="text-foreground/70 mb-6">
              Start by adding your first property
            </p>
            <Link
              href="/host/dashboard/add"
              className="inline-block bg-foreground text-background px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <div
                key={property._id.toString()}
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
                  <p className="text-sm text-foreground/70 mb-2">{property.location}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg">
                      ${property.price}
                      <span className="text-sm font-normal text-foreground/70">/night</span>
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/property/${property._id.toString()}`}
                      className="flex-1 text-center glass-light px-3 py-2 rounded-lg text-sm hover:scale-[1.02] transition-transform"
                    >
                      View
                    </Link>
                    <Link
                      href={`/host/dashboard/edit/${property._id.toString()}`}
                      className="flex-1 text-center bg-foreground text-background px-3 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

