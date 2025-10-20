import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary credentials');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Cloudinary credentials' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json(
        { error: 'Missing parameters to sign' },
        { status: 400 }
      );
    }

    // Generate signature for secure upload
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    // Return signature and api_key (api_key is needed by next-cloudinary for signed uploads)
    return NextResponse.json({ 
      signature,
      api_key: process.env.CLOUDINARY_API_KEY 
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}

