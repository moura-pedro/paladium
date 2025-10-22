# Quick Start Guide

Get Paladium running in 5 minutes!

## Prerequisites

Make sure you have installed:
- Node.js 18+ 
- Yarn
- Git

## Step 1: Install Dependencies

\`\`\`bash
yarn install
\`\`\`

## Step 2: Set Up Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`bash
# For quick local testing (MongoDB required)
MONGODB_URI=mongodb://localhost:27017/paladium

# Get these from https://clerk.com (free tier available)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Get this from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_key_here

# Get these from https://cloudinary.com (free tier available)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
\`\`\`

### Quick Setup Links:

1. **Clerk** (Authentication): https://dashboard.clerk.com/
   - Create new application
   - Copy API keys
   
2. **OpenAI** (AI Agent): https://platform.openai.com/api-keys
   - Create new secret key
   
3. **MongoDB Atlas** (Database): https://cloud.mongodb.com/
   - Create free cluster
   - Get connection string
   
4. **Cloudinary** (Images): https://cloudinary.com/console
   - Sign up
   - Create unsigned upload preset named "paladium"
   - Copy credentials

## Step 3: Run Development Server

\`\`\`bash
yarn dev
\`\`\`

Open http://localhost:3000

## Step 4: Try It Out!

1. Click "Sign Up"
2. Create an account
3. Choose "Guest" or "Host" role
4. If Guest: Click "AI Assistant" and try: "Find a property in Miami"
5. If Host: Click "Add Property" to list your first property

## Troubleshooting

### "MongoDB connection failed"
- Make sure MongoDB is running (locally or Atlas)
- Check your connection string in `.env.local`

### "Clerk error" 
- Verify your Clerk keys are correct
- Make sure both publishable and secret keys are set

### "OpenAI error"
- Check your API key is active
- Ensure you have credits in your OpenAI account

### "Image upload not working"
- Verify Cloudinary preset is set to "unsigned"
- Check that preset name is exactly "paladium"

## Next Steps

- Read the full README.md for detailed documentation
- Deploy to Vercel with `vercel` command

## Need Help?

Open an issue on GitHub or check the README for more details.

Happy building! 🚀

