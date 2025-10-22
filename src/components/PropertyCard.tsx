'use client';

import Image from 'next/image';

export interface PropertyCardData {
  propertyId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images?: string[];
  index?: number;
}

interface PropertyCardProps {
  property: PropertyCardData;
  onViewDetails?: (property: PropertyCardData) => void;
}

export default function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder-property.jpg';

  const handleClick = () => {
    if (onViewDetails) {
      onViewDetails(property);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="block group w-full text-left"
    >
      <div className="glass overflow-hidden rounded-2xl hover:scale-[1.02] transition-all duration-300 shadow-lg">
        {/* Image Section */}
        <div className="relative w-full h-48 bg-gradient-to-br from-foreground/10 to-foreground/5">
          {property.images && property.images.length > 0 ? (
            <Image
              src={mainImage}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
          {property.index && (
            <div className="absolute top-3 left-3 bg-foreground text-background px-3 py-1 rounded-full text-sm font-bold">
              #{property.index}
            </div>
          )}
          {property.images && property.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-1">
              📷 {property.images.length}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title & Location */}
          <div className="mb-3">
            <h3 className="text-lg font-bold mb-1 group-hover:text-foreground/80 transition-colors">
              {property.title}
            </h3>
            <p className="text-sm text-foreground/60 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {property.location}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
            {property.description}
          </p>

          {/* Property Details */}
          <div className="flex items-center gap-3 text-sm text-foreground/60 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {property.maxGuests} guests
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              {property.bathrooms} bath
            </span>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {property.amenities.slice(0, 3).map((amenity, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs bg-foreground/10 px-2 py-1 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
                {property.amenities.length > 3 && (
                  <span className="text-xs text-foreground/50 px-2 py-1">
                    +{property.amenities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-foreground/10">
            <div>
              <span className="text-2xl font-bold">${property.price}</span>
              <span className="text-sm text-foreground/60"> / night</span>
            </div>
            <div className="text-sm font-semibold text-foreground group-hover:translate-x-1 transition-transform">
              View Details →
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

