import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/lib/models/User';
import { processAgentMessage } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await dbConnect();

    // Get the user from our database
    const user = await User.findOne({ clerkId }) as IUser | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please complete onboarding.' }, { status: 404 });
    }

    // Process the message with the AI agent
    const result = await processAgentMessage(
      message,
      user._id.toString(),
      conversationId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

