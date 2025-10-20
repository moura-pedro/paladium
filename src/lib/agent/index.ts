import type OpenAI from 'openai';
import { Types } from 'mongoose';
import dbConnect from '../db';
import Conversation from '../models/Conversation';
import { openai, getCurrentDate } from './config';
import { agentTools } from './tools';
import { getSystemPrompt } from './prompts';
import { searchProperties, getPropertyDetails } from './functions/properties';
import { prepareBooking, confirmBooking, getMyBookings, cancelBooking } from './functions/bookings';

/**
 * Execute a tool function call
 */
async function executeToolCall(
  functionName: string,
  functionArgs: any,
  userId: string
): Promise<any> {
  console.log(`\n🔧 Executing tool: ${functionName}`);
  console.log('   Arguments:', JSON.stringify(functionArgs, null, 2));

  let result;

  switch (functionName) {
    case 'search_properties':
      result = await searchProperties(functionArgs);
      break;

    case 'get_property_details':
      result = await getPropertyDetails(functionArgs.propertyId);
      break;

    case 'prepare_booking':
      console.log('   → propertyId being used:', functionArgs.propertyId);
      result = await prepareBooking(functionArgs);
      break;

    case 'confirm_booking':
      console.log('   → propertyId being used:', functionArgs.propertyId);
      result = await confirmBooking({
        ...functionArgs,
        guestId: userId,
      });
      break;

    case 'get_my_bookings':
      result = await getMyBookings(userId, functionArgs.status);
      break;

    case 'cancel_booking':
      console.log('   → bookingId being used:', functionArgs.bookingId);
      result = await cancelBooking(functionArgs.bookingId, userId);
      break;

    default:
      result = { error: 'Unknown function' };
  }

  console.log(`   ✓ Tool completed successfully`);
  return result;
}

/**
 * Build the messages array for OpenAI from conversation history
 */
function buildMessagesArray(
  conversation: any,
  newMessage: string,
  systemPrompt: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Add conversation history (limit to last 20 messages to avoid token limits)
  // Skip 'tool' messages as they require full tool_calls context we don't persist
  const recentMessages = conversation.messages.slice(-20);
  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
    // Skip 'tool' and 'system' messages from history
  }

  // Add the new user message
  messages.push({
    role: 'user',
    content: newMessage,
  });

  return messages;
}

/**
 * Load or create a conversation for the user
 */
async function loadOrCreateConversation(
  userId: string,
  conversationId?: string
): Promise<any> {
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

  return conversation;
}

/**
 * Process a user message and return the AI agent's response
 * 
 * This is the main entry point for the AI agent functionality.
 * It handles conversation management, tool execution, and message history.
 */
export async function processAgentMessage(
  message: string,
  userId: string,
  conversationId?: string
) {
  await dbConnect();

  // Load or create conversation
  const conversation = await loadOrCreateConversation(userId, conversationId);

  // Build messages array for OpenAI
  const systemPrompt = getSystemPrompt(getCurrentDate());
  const messages = buildMessagesArray(conversation, message, systemPrompt);

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
  const toolResults: any[] = [];

  // Handle tool calls in a loop until no more tools are called
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
        functionResult = await executeToolCall(functionName, functionArgs, userId);

        toolResults.push({
          name: functionName,
          result: functionResult,
        });
      } catch (error: any) {
        console.error(`\n❌ Error executing ${functionName}:`, error.message);
        console.error('   Function args:', JSON.stringify(functionArgs, null, 2));
        if (error.stack) {
          console.error('   Stack:', error.stack);
        }

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

// Export individual functions for direct use if needed
export { searchProperties, getPropertyDetails, prepareBooking, confirmBooking, getMyBookings, cancelBooking };
export { agentTools };

