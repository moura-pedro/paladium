// Shared types for the application

export type UserRole = 'guest' | 'host';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface LocationData {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  needsOnboarding?: boolean;
}

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: LocationData | string; // Support both structured and legacy string format
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  from: Date;
  to: Date;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentResponse {
  message: string;
  functionCalled?: string;
  functionResult?: any;
  error?: string;
}

