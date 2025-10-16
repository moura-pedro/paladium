import OpenAI from 'openai';
import dbConnect from './db';
import Property from './models/Property';
import Booking, { IBooking } from './models/Booking';
import Conversation, { IMessage } from './models/Conversation';
import { Types } from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define tools using the new tools API
export const agentTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_properties',
      description: 'Search for available properties based on criteria like location, price, dates, and number of guests. Use this when users ask about finding or looking for properties.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Location to search for (city, region, etc.)',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price per night',
          },
          minGuests: {
            type: 'number',
            description: 'Minimum number of guests the property should accommodate',
          },
          checkIn: {
            type: 'string',
            description: 'Check-in date in ISO format (YYYY-MM-DD)',
          },
          checkOut: {
            type: 'string',
            description: 'Check-out date in ISO format (YYYY-MM-DD)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_property_details',
      description: 'Get detailed information about a specific property by its ID',
      parameters: {
        type: 'object',
        properties: {
          propertyId: {
            type: 'string',
            description: 'The ID of the property',
          },
        },
        required: ['propertyId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'prepare_booking',
      description: 'Prepare a booking by calculating total price and showing a summary. Always use this BEFORE confirm_booking to show the user what they will be charged.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: {
            type: 'string',
            description: 'The ID of the property to book',
          },
          checkIn: {
            type: 'string',
            description: 'Check-in date in ISO format (YYYY-MM-DD)',
          },
          checkOut: {
            type: 'string',
            description: 'Check-out date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['propertyId', 'checkIn', 'checkOut'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'confirm_booking',
      description: 'Confirm and create the actual booking. ONLY use this after prepare_booking and after the user explicitly confirms (e.g., says "yes", "confirm", "book it").',
      parameters: {
        type: 'object',
        properties: {
          propertyId: {
            type: 'string',
            description: 'The ID of the property to book',
          },
          checkIn: {
            type: 'string',
            description: 'Check-in date in ISO format (YYYY-MM-DD)',
          },
          checkOut: {
            type: 'string',
            description: 'Check-out date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['propertyId', 'checkIn', 'checkOut'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_my_bookings',
      description: 'Get the user\'s bookings. Can filter by status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['upcoming', 'past', 'all'],
            description: 'Filter bookings by status. "upcoming" for future bookings, "past" for completed ones, "all" for everything.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancel_booking',
      description: 'Cancel a specific booking by its ID',
      parameters: {
        type: 'object',
        properties: {
          bookingId: {
            type: 'string',
            description: 'The ID of the booking to cancel',
          },
        },
        required: ['bookingId'],
      },
    },
  },
];

// Search properties with availability filtering
export async function searchProperties(params: {
  location?: string;
  maxPrice?: number;
  minGuests?: number;
  checkIn?: string;
  checkOut?: string;
}) {
  await dbConnect();

  const query: any = {};

  if (params.location) {
    query.location = { $regex: params.location, $options: 'i' };
  }

  if (params.maxPrice) {
    query.price = { $lte: params.maxPrice };
  }

  if (params.minGuests) {
    query.maxGuests = { $gte: params.minGuests };
  }

  console.log('Search query:', JSON.stringify(query, null, 2));
  console.log('Search params:', params);

  let properties = await Property.find(query).limit(10).lean();
  
  console.log(`Found ${properties.length} properties before availability filtering`);

  // If dates are provided, filter out properties with conflicting bookings
  if (params.checkIn && params.checkOut) {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    const availableProperties = [];

    for (const property of properties) {
      const conflictingBooking = await Booking.findOne({
        propertyId: property._id,
        status: { $nin: ['cancelled'] },
        $or: [
          { from: { $lte: checkInDate }, to: { $gt: checkInDate } },
          { from: { $lt: checkOutDate }, to: { $gte: checkOutDate } },
          { from: { $gte: checkInDate }, to: { $lte: checkOutDate } },
        ],
      });

      if (!conflictingBooking) {
        availableProperties.push(property);
      }
    }

    properties = availableProperties;
  }

  return properties.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    description: p.description,
    location: p.location,
    price: p.price,
    maxGuests: p.maxGuests,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    amenities: p.amenities,
  }));
}

// Get property details
export async function getPropertyDetails(propertyId: string) {
  await dbConnect();

  const property = await Property.findById(propertyId).populate('hostId').lean();

  if (!property) {
    throw new Error('Property not found');
  }

  return {
    id: property._id.toString(),
    title: property.title,
    description: property.description,
    location: property.location,
    price: property.price,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    amenities: property.amenities,
    images: property.images,
  };
}

// Prepare booking - calculate price and return summary
export async function prepareBooking(params: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
}) {
  await dbConnect();

  const property = await Property.findById(params.propertyId);

  if (!property) {
    throw new Error('Property not found');
  }

  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);

  // Validate dates
  if (checkInDate >= checkOutDate) {
    throw new Error('Check-out date must be after check-in date');
  }

  if (checkInDate < new Date()) {
    throw new Error('Check-in date cannot be in the past');
  }

  // Check for conflicts
  const conflictingBooking = await Booking.findOne({
    propertyId: params.propertyId,
    status: { $nin: ['cancelled'] },
    $or: [
      { from: { $lte: checkInDate }, to: { $gt: checkInDate } },
      { from: { $lt: checkOutDate }, to: { $gte: checkOutDate } },
      { from: { $gte: checkInDate }, to: { $lte: checkOutDate } },
    ],
  });

  if (conflictingBooking) {
    throw new Error('This property is already booked for the selected dates');
  }

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = nights * property.price;

  return {
    property: {
      id: property._id.toString(),
      title: property.title,
      location: property.location,
      pricePerNight: property.price,
    },
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    totalPrice,
    message: `Ready to book ${property.title} for ${nights} night(s) at $${totalPrice} total. Please confirm to proceed.`,
  };
}

// Confirm booking - actually create the booking
export async function confirmBooking(params: {
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
}) {
  await dbConnect();

  const property = await Property.findById(params.propertyId);

  if (!property) {
    throw new Error('Property not found');
  }

  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);

  // Double-check for conflicts
  const conflictingBooking = await Booking.findOne({
    propertyId: params.propertyId,
    status: { $nin: ['cancelled'] },
    $or: [
      { from: { $lte: checkInDate }, to: { $gt: checkInDate } },
      { from: { $lt: checkOutDate }, to: { $gte: checkOutDate } },
      { from: { $gte: checkInDate }, to: { $lte: checkOutDate } },
    ],
  });

  if (conflictingBooking) {
    throw new Error('This property is no longer available for the selected dates');
  }

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = nights * property.price;

  const booking = (await Booking.create({
    propertyId: params.propertyId,
    guestId: params.guestId,
    from: checkInDate,
    to: checkOutDate,
    totalPrice,
    status: 'confirmed',
  })) as IBooking;

  return {
    success: true,
    bookingId: booking._id.toString(),
    property: property.title,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    totalPrice,
    message: `Booking confirmed! Your reservation ID is ${booking._id.toString()}. You'll stay at ${property.title} from ${params.checkIn} to ${params.checkOut}.`,
  };
}

// Get user's bookings
export async function getMyBookings(userId: string, status?: 'upcoming' | 'past' | 'all') {
  await dbConnect();

  const query: any = { guestId: userId };

  if (status === 'upcoming') {
    query.from = { $gte: new Date() };
    query.status = { $nin: ['cancelled'] };
  } else if (status === 'past') {
    query.to = { $lt: new Date() };
  }

  const bookings = await Booking.find(query)
    .populate('propertyId')
    .sort({ from: -1 })
    .lean();

  return bookings.map((b: any) => ({
    id: b._id.toString(),
    property: {
      id: b.propertyId._id.toString(),
      title: b.propertyId.title,
      location: b.propertyId.location,
    },
    checkIn: b.from.toISOString().split('T')[0],
    checkOut: b.to.toISOString().split('T')[0],
    totalPrice: b.totalPrice,
    status: b.status,
  }));
}

// Cancel a booking
export async function cancelBooking(bookingId: string, userId: string) {
  await dbConnect();

  const booking = await Booking.findById(bookingId).populate('propertyId');

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verify the booking belongs to the user
  if (booking.guestId.toString() !== userId) {
    throw new Error('You can only cancel your own bookings');
  }

  if (booking.status === 'cancelled') {
    throw new Error('This booking is already cancelled');
  }

  booking.status = 'cancelled';
  await booking.save();

  return {
    success: true,
    message: `Booking cancelled successfully. Your reservation for ${(booking.propertyId as any).title} has been cancelled.`,
  };
}

// Process agent message with conversation history
export async function processAgentMessage(
  message: string,
  userId: string,
  conversationId?: string
) {
  await dbConnect();

  // Load or create conversation
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.userId.toString() !== userId) {
      conversation = null;
    }
  }

  if (!conversation) {
    conversation = await Conversation.create({
      userId: new Types.ObjectId(userId),
      messages: [],
      lastActive: new Date(),
    });
  }

  // Build messages array for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant for Paladium, a property rental platform. 

Your capabilities:
- Search for properties based on location, price, dates, and guest capacity
- Get detailed information about properties
- Help users book properties with a two-step process (prepare, then confirm)
- Show users their existing bookings
- Cancel bookings

Guidelines:
- Be friendly, conversational, and helpful
- When users want to book, always ask for missing information (dates, number of guests)
- ALWAYS use prepare_booking first to show the summary and total price
- Only use confirm_booking after the user explicitly agrees to the booking
- When showing search results, present them clearly with key details
- Help users understand the booking process
- Parse natural language dates (e.g., "next weekend", "December 25th")

Remember: Never confirm a booking without the user's explicit approval after seeing the price.`,
    },
  ];

  // Add conversation history (limit to last 20 messages to avoid token limits)
  const recentMessages = conversation.messages.slice(-20);
  for (const msg of recentMessages) {
    if (msg.role === 'tool') {
      messages.push({
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.toolCallId || 'unknown',
      });
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add the new user message
  messages.push({
    role: 'user',
    content: message,
  });

  // Save user message to conversation
  conversation.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  // Call OpenAI with tools
  let response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: agentTools,
    tool_choice: 'auto',
  });

  let responseMessage = response.choices[0].message;
  let toolResults: any[] = [];

  // Handle tool calls
  while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    // Add assistant message with tool calls to conversation (only if has content)
    const assistantContent = responseMessage.content || '[Using tools]';
    conversation.messages.push({
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    });

    // Add assistant message to messages array
    messages.push(responseMessage);

    // Execute each tool call
    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.type !== 'function') continue;
      
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      let functionResult;

      try {
        if (functionName === 'search_properties') {
          functionResult = await searchProperties(functionArgs);
        } else if (functionName === 'get_property_details') {
          functionResult = await getPropertyDetails(functionArgs.propertyId);
        } else if (functionName === 'prepare_booking') {
          functionResult = await prepareBooking(functionArgs);
        } else if (functionName === 'confirm_booking') {
          functionArgs.guestId = userId;
          functionResult = await confirmBooking(functionArgs);
        } else if (functionName === 'get_my_bookings') {
          functionResult = await getMyBookings(userId, functionArgs.status);
        } else if (functionName === 'cancel_booking') {
          functionResult = await cancelBooking(functionArgs.bookingId, userId);
        } else {
          functionResult = { error: 'Unknown function' };
        }

        toolResults.push({
          name: functionName,
          result: functionResult,
        });
      } catch (error: any) {
        functionResult = { error: error.message };
        toolResults.push({
          name: functionName,
          result: functionResult,
          error: error.message,
        });
      }

      // Add tool result to messages
      const toolMessage: OpenAI.Chat.ChatCompletionToolMessageParam = {
        role: 'tool',
        content: JSON.stringify(functionResult),
        tool_call_id: toolCall.id,
      };
      messages.push(toolMessage);

      // Save tool result to conversation
      conversation.messages.push({
        role: 'tool',
        content: JSON.stringify(functionResult),
        timestamp: new Date(),
        toolCallId: toolCall.id,
        toolName: functionName,
      });
    }

    // Get next response from OpenAI
    response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: agentTools,
      tool_choice: 'auto',
    });

    responseMessage = response.choices[0].message;
  }

  // Save final assistant message
  const finalContent = responseMessage.content || 'I apologize, but I couldn\'t process that request.';
  conversation.messages.push({
    role: 'assistant',
    content: finalContent,
    timestamp: new Date(),
  });

  // Update last active time and save
  conversation.lastActive = new Date();
  await conversation.save();

  return {
    message: finalContent,
    conversationId: conversation._id.toString(),
    toolResults: toolResults.length > 0 ? toolResults : undefined,
  };
}
