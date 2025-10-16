import Link from 'next/link';
import { requireHost } from '@/lib/auth';
import AddPropertyForm from './AddPropertyForm';

export default async function AddPropertyPage() {
  const user = await requireHost();

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
          <h1 className="text-4xl font-bold mb-2">Add New Property</h1>
          <p className="text-foreground/70">List your property on Paladium</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <AddPropertyForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}

