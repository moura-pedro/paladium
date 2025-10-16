import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8">
        <SignUp />
      </div>
    </div>
  );
}

