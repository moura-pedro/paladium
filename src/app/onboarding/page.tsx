'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function OnboardingPage() {
  const [role, setRole] = useState<'guest' | 'host' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async () => {
    if (!role || !user) return;

    setLoading(true);

    try {
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          role,
        }),
      });

      if (response.ok) {
        router.push(role === 'host' ? '/host/dashboard' : '/');
      } else {
        alert('Error creating profile. Please try again.');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Error creating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-2 text-center">Welcome to Paladium</h1>
        <p className="text-center text-foreground/70 mb-8">Choose how you'd like to use our platform</p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setRole('guest')}
            className={`glass-light rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] ${
              role === 'guest' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-4xl mb-3">🏖️</div>
            <h3 className="text-xl font-semibold mb-2">I'm a Guest</h3>
            <p className="text-foreground/70 text-sm">
              Looking to find and book amazing properties for my travels
            </p>
          </button>

          <button
            onClick={() => setRole('host')}
            className={`glass-light rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] ${
              role === 'host' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-4xl mb-3">🏡</div>
            <h3 className="text-xl font-semibold mb-2">I'm a Host</h3>
            <p className="text-foreground/70 text-sm">
              Ready to list my properties and welcome guests
            </p>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!role || loading}
          className="w-full bg-foreground text-background py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? 'Creating your profile...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

