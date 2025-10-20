'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import LocationSelector, { LocationData } from '@/components/LocationSelector';

interface Props {
  userId: string;
}

export default function AddPropertyForm({ userId }: Props) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    amenities: '',
  });
  const [location, setLocation] = useState<LocationData | null>(null);
  const [images, setImages] = useState<string[]>([]);
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
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: userId,
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
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create property');
      }
    } catch (err) {
      console.error('Property creation error:', err);
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
        <label className="block text-sm font-medium mb-2">Images</label>
        <div className="space-y-3">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="aspect-square relative rounded-lg overflow-hidden glass-light">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <CldUploadWidget
            uploadPreset="paladium"
            onSuccess={(result: any) => {
              setImages([...images, result.info.secure_url]);
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="w-full glass-light px-4 py-3 rounded-xl border-2 border-dashed border-foreground/20 hover:border-foreground/40 transition-colors"
              >
                + Upload Image
              </button>
            )}
          </CldUploadWidget>
          <p className="text-xs text-foreground/50">
            Note: You'll need to configure Cloudinary for image uploads to work
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Creating Property...' : 'Create Property'}
      </button>
    </form>
  );
}

