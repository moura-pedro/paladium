import type OpenAI from 'openai';

/**
 * Tool definitions for the AI agent using OpenAI's function calling API
 */
export const agentTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
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
    type: 'function',
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
    type: 'function',
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
    type: 'function',
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
    type: 'function',
    function: {
      name: 'get_my_bookings',
      description: 'Get the user\'s bookings. By default excludes cancelled bookings. Use "upcoming" for future trips, "past" for completed trips, or "all" to include cancelled bookings.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['upcoming', 'past', 'all'],
            description: 'Filter bookings by status. Default/no parameter: active bookings only (excludes cancelled). "upcoming": future active bookings. "past": completed bookings. "all": includes cancelled bookings.',
          },
        },
      },
    },
  },
  {
    type: 'function',
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

