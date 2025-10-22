'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface PropertyDetails {
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
}

interface PropertyDetailsModalProps {
  property: PropertyDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailsModal({ property, isOpen, onClose }: PropertyDetailsModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  const currentImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center glass-light rounded-full hover:scale-110 transition-transform"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Gallery */}
        {currentImage ? (
          <>
            <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-foreground/10 to-foreground/5">
              <Image
                src={currentImage}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
              {property.images && property.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">
                  📷 {property.images.length} {property.images.length === 1 ? 'photo' : 'photos'}
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {property.images && property.images.length > 1 && (
              <div className={`grid gap-2 p-3 bg-foreground/5 ${
                property.images.length === 2 ? 'grid-cols-2' :
                property.images.length === 3 ? 'grid-cols-3' :
                property.images.length === 4 ? 'grid-cols-4' :
                'grid-cols-5'
              }`}>
                {property.images.slice(1).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square relative rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                    <Image src={img} alt={`${property.title} ${idx + 2}`} fill className="object-cover" sizes="200px" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center">
            <svg className="w-24 h-24 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Title & Location */}
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h2>
            <p className="text-lg text-foreground/70 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {property.location}
            </p>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 glass-light rounded-xl">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${property.price}</span>
              <span className="text-lg text-foreground/60">per night</span>
            </div>
          </div>

          {/* Property Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 glass-light rounded-xl">
              <svg className="w-8 h-8 mx-auto mb-2 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="font-bold text-xl">{property.maxGuests}</div>
              <div className="text-sm text-foreground/60">Guests</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <svg className="w-8 h-8 mx-auto mb-2 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div className="font-bold text-xl">{property.bedrooms}</div>
              <div className="text-sm text-foreground/60">Bedrooms</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <svg className="w-8 h-8 mx-auto mb-2 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <div className="font-bold text-xl">{property.bathrooms}</div>
              <div className="text-sm text-foreground/60">Bathrooms</div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">About this property</h3>
            <p className="text-foreground/80 leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <span 
                    key={idx} 
                    className="glass-light px-4 py-2 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-foreground/10">
            <Link
              href={`/property/${property.propertyId}`}
              className="flex-1 bg-foreground text-background px-6 py-3 rounded-xl font-semibold text-center hover:opacity-90 transition-opacity"
              onClick={onClose}
            >
              Go to Full Page
            </Link>
            <button
              onClick={onClose}
              className="flex-1 glass-light px-6 py-3 rounded-xl font-semibold hover:scale-[1.02] transition-transform"
            >
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

