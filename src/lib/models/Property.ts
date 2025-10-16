import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IProperty extends Document {
  _id: Types.ObjectId;
  hostId: Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  price: number; // Price per night
  location: string;
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching properties
PropertySchema.index({ location: 1, price: 1 });

// Prevent model recompilation in development
const Property: Model<IProperty> = mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

export default Property;

