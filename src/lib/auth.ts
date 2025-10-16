import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import dbConnect from './db';
import User, { UserRole, IUser } from './models/User';

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  await dbConnect();

  // Find or create user in our database
  let user = await User.findOne({ clerkId: clerkUser.id }) as IUser | null;

  if (!user) {
    // User not in our DB yet, they need to complete onboarding
    return {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      needsOnboarding: true,
    };
  }

  return {
    id: user._id.toString(),
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    needsOnboarding: false,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  if (user.needsOnboarding) {
    redirect('/onboarding');
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  
  if (user.role !== role) {
    redirect('/');
  }

  return user;
}

export async function requireHost() {
  return requireRole('host');
}

export async function requireGuest() {
  return requireRole('guest');
}

