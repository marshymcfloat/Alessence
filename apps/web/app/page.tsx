import SignInDialog from "@/components/landing/SignInDialog";
import Image from "next/image";

const Page = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-pink-50 via-pink-100 to-white px-4">
      <div className="flex animate-fade-in-up flex-col items-center gap-y-6 text-center">
        <Image
          src="/logo.png"
          width={280}
          height={280}
          alt="Alessence Logo"
          priority
          className="drop-shadow-lg"
          unoptimized={false}
        />

        <h1 className="max-w-lg text-4xl font-light text-slate-800 sm:text-5xl">
          <span className="font-bold text-slate-900">Alessence</span>, your
          accountancy study buddy
        </h1>

        <p className="max-w-md text-slate-600">
          Welcome back! Your personal study space is ready for you.
        </p>
        <SignInDialog />
      </div>
    </main>
  );
};

export default Page;
