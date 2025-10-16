import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  guestId: Types.ObjectId;
  from: Date;
  to: Date;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help with date range queries
BookingSchema.index({ propertyId: 1, from: 1, to: 1 });
BookingSchema.index({ guestId: 1, status: 1 });

// Pre-save hook to check for booking conflicts
BookingSchema.pre('save', async function (next) {
  if (!this.isModified('from') && !this.isModified('to') && !this.isNew) {
    return next();
  }

  // Check if there are any overlapping bookings for this property
  const overlappingBooking = await (this.constructor as Model<IBooking>).findOne({
    _id: { $ne: this._id }, // Exclude current booking if updating
    propertyId: this.propertyId,
    status: { $nin: ['cancelled'] }, // Ignore cancelled bookings
    $or: [
      // New booking starts during an existing booking
      { from: { $lte: this.from }, to: { $gt: this.from } },
      // New booking ends during an existing booking
      { from: { $lt: this.to }, to: { $gte: this.to } },
      // New booking encompasses an existing booking
      { from: { $gte: this.from }, to: { $lte: this.to } },
    ],
  });

  if (overlappingBooking) {
    const error = new Error('Property is already booked for the selected dates');
    return next(error);
  }

  // Validate that 'from' date is before 'to' date
  if (this.from >= this.to) {
    const error = new Error('Check-in date must be before check-out date');
    return next(error);
  }

  next();
});

// Prevent model recompilation in development
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;

