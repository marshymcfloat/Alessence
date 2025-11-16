import SignInDialog from "@/components/landing/SignInDialog";
import Image from "next/image";
import {
  BookOpen,
  CheckSquare,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const Page = () => {
  const features = [
    {
      icon: CheckSquare,
      title: "Task Management",
      description:
        "Organize your studies with a visual Kanban board. Track tasks by subject with color-coded indicators and never miss a deadline.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Exams",
      description:
        "Generate personalized exams from your study materials using Google Gemini AI. Practice with multiple question types and track your progress.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: FileText,
      title: "File Organization",
      description:
        "Upload and organize PDFs, DOCX, and text files by subject. Automatic content extraction makes your materials searchable.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: BookOpen,
      title: "Subject Management",
      description:
        "Create and manage subjects by semester. Keep everything organized with subject-based grouping for tasks, files, and exams.",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 py-20">
        <div className="relative z-10 flex max-w-6xl flex-col items-center gap-8 text-center">
          <div className="relative animate-fade-in-up">
            <div className="absolute inset-0 rounded-full bg-linear-to-r from-pink-400 to-purple-400 blur-2xl opacity-50" />
            <Image
              src="/logo.png"
              width={200}
              height={200}
              alt="Alessence Logo"
              priority
              className="relative drop-shadow-2xl"
              unoptimized={false}
            />
          </div>

          <div className="space-y-4 animate-fade-in-up [animation-delay:100ms] ">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              <span className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Alessence
              </span>
            </h1>
            <p className="text-2xl font-light text-slate-700 sm:text-3xl">
              Your accountancy study buddy
            </p>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-lg text-slate-600 sm:text-xl animate-fade-in-up [animation-delay:200ms]">
            Streamline your accountancy studies with AI-powered exam generation,
            visual task management, and intelligent file organization.
            Everything you need to excel, all in one place.
          </p>

          {/* CTA Button */}
          <div className="animate-fade-in-up [animation-delay:300ms]">
            <SignInDialog />
          </div>

          {/* Stats or Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600 animate-fade-in-up [animation-delay:400ms]">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-pink-500" />
              <span className="font-medium">Task Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="font-medium">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Track Progress</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Powerful features designed specifically for accountancy students
              to help you stay organized and excel in your studies.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{
                    animationDelay: `${500 + index * 100}ms`,
                  }}
                >
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                  />

                  {/* Icon */}
                  <div
                    className={`mb-4 inline-flex rounded-xl bg-linear-to-br ${feature.color} p-3 text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 p-12 text-center text-white shadow-2xl">
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to transform your study routine?
              </h2>
              <p className="mb-8 text-lg text-pink-50">
                Join Alessence today and take control of your accountancy
                studies.
              </p>
              <SignInDialog />
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
