import { SignupForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign up — FlowView",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-white">Create your account</h1>
        <p className="mb-8 text-sm text-zinc-400">
          Start auditing your automation stack
        </p>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:text-blue-300">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
