import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

interface NavProps {
  user?: {
    id: string;
    role?: 'guest' | 'host';
    needsOnboarding?: boolean;
  } | null;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export default function Navigation({ user, showBackButton, backUrl = '/', backLabel = '← Paladium' }: NavProps) {
  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={showBackButton ? backUrl : '/'} className="text-2xl font-bold">
            {showBackButton ? backLabel : 'Paladium'}
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
                
                {user.role === 'host' && (
                  <Link
                    href="/host/dashboard"
                    className="glass-light px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
                  >
                    My Properties
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
  );
}

