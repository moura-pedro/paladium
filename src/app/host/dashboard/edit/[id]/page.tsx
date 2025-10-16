import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireHost } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/lib/models/Property';
import User from '@/lib/models/User';
import EditPropertyForm from './EditPropertyForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const user = await requireHost();

  await dbConnect();
  
  const dbUser = await User.findOne({ clerkId: user.clerkId });
  const property = await Property.findById(id).lean();
  
  if (!property) {
    notFound();
  }

  // Verify the user owns this property
  if (property.hostId.toString() !== dbUser!._id.toString()) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/host/dashboard" className="text-2xl font-bold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Property</h1>
          <p className="text-foreground/70">Update your property details</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <EditPropertyForm
            propertyId={id}
            initialData={{
              title: property.title,
              description: property.description,
              location: property.location,
              price: property.price.toString(),
              maxGuests: property.maxGuests.toString(),
              bedrooms: property.bedrooms.toString(),
              bathrooms: property.bathrooms.toString(),
              amenities: property.amenities.join(', '),
              images: property.images || [],
            }}
          />
        </div>
      </div>
    </div>
  );
}

