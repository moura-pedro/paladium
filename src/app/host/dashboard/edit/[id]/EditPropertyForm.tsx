'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import LocationSelector, { LocationData } from '@/components/LocationSelector';

interface Props {
  propertyId: string;
  initialData: {
    title: string;
    description: string;
    location: LocationData | string;
    price: string;
    maxGuests: string;
    bedrooms: string;
    bathrooms: string;
    amenities: string;
    images: string[];
  };
}

export default function EditPropertyForm({ propertyId, initialData }: Props) {
  // Convert old string location to structured format if needed
  const initialLocation = typeof initialData.location === 'string' 
    ? null 
    : initialData.location;

  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    price: initialData.price,
    maxGuests: initialData.maxGuests,
    bedrooms: initialData.bedrooms,
    bathrooms: initialData.bathrooms,
    amenities: initialData.amenities,
  });
  const [location, setLocation] = useState<LocationData | null>(initialLocation);
  const [images, setImages] = useState<string[]>(initialData.images);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!location) {
      setError('Please select a location');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: location,
          price: Number(formData.price),
          maxGuests: Number(formData.maxGuests),
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
          images,
        }),
      });

      if (response.ok) {
        router.push('/host/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update property');
      }
    } catch (err) {
      console.error('Property update error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/host/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete property');
      }
    } catch (err) {
      console.error('Property delete error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Property Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Beautiful lakefront cabin"
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your property..."
          rows={4}
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none resize-none"
          required
        />
      </div>

      <div>
        <LocationSelector
          value={location || undefined}
          onChange={setLocation}
          required
        />
        {typeof initialData.location === 'string' && !location && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Note: This property has an old location format ({initialData.location}). Please select a new structured location.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Price per night ($)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="150"
            min="0"
            className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Max Guests</label>
          <input
            type="number"
            name="maxGuests"
            value={formData.maxGuests}
            onChange={handleChange}
            placeholder="4"
            min="1"
            className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bedrooms</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            placeholder="2"
            min="0"
            className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bathrooms</label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            placeholder="1"
            min="0"
            step="0.5"
            className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amenities (comma-separated)</label>
        <input
          type="text"
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          placeholder="WiFi, Kitchen, Parking, Pool"
          className="w-full glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Images {images.length > 0 && <span className="text-foreground/50">({images.length}/10)</span>}
        </label>
        <div className="space-y-3">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="aspect-square relative rounded-lg overflow-hidden glass-light group">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-all opacity-90 group-hover:opacity-100 shadow-lg"
                    title="Remove image"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
            <CldUploadWidget
              uploadPreset="paladium"
              options={{
                multiple: true,
                maxFiles: 10 - images.length,
                resourceType: 'image',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                maxFileSize: 10000000, // 10MB
                sources: ['local', 'camera', 'url'],
                folder: 'paladium-properties',
                tags: ['property-images'],
              }}
              onSuccess={(result: any) => {
                console.log('Upload result:', result);
                if (result?.info?.secure_url) {
                  setImages(prev => {
                    // Check if this URL is already in the array to prevent duplicates
                    if (!prev.includes(result.info.secure_url)) {
                      const newImages = [...prev, result.info.secure_url];
                      console.log('Updated images array:', newImages);
                      return newImages;
                    }
                    return prev;
                  });
                }
              }}
              onUpload={(result: any) => {
                console.log('Upload started:', result);
              }}
              onUploadAdded={(result: any) => {
                console.log('Upload added:', result);
              }}
              onError={(error: any) => {
                console.error('Upload error:', error);
                setError('Failed to upload image. Please try again.');
              }}
              onClose={(result: any) => {
                console.log('Upload widget closed:', result);
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  disabled={images.length >= 10}
                  className="w-full glass-light px-4 py-4 rounded-xl border-2 border-dashed border-foreground/20 hover:border-foreground/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {images.length >= 10 ? (
                    <span>Maximum 10 images reached</span>
                  ) : (
                    <span>+ Upload Images (Select Multiple)</span>
                  )}
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <div className="glass-light px-4 py-3 rounded-xl border-2 border-amber-500/20 bg-amber-500/5">
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                ⚠️ Cloudinary not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file and restart the server.
              </p>
            </div>
          )}
          <p className="text-xs text-foreground/50">
            📷 You can upload up to 10 images. Select multiple files at once! Supported formats: JPG, PNG, WEBP, GIF (max 10MB per image)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-foreground text-background py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? 'Updating...' : 'Update Property'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="px-6 bg-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

