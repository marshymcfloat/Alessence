import { getSystemSyllabusAction } from "@/lib/actions/subjectActions";
import SyllabusView from "@/components/dashboard/SyllabusView";
import { Info } from "lucide-react";

export default async function SyllabusPage({ params }: { params: { id: string } }) {
  // Await params first (Next.js 15+ requirement if applicable, but good practice generally)
  const { id } = await params;
  const { data: subjects, success, error } = await getSystemSyllabusAction();

  if (!success) {
    return <div>Error loading syllabus: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">CPALE Syllabus Map</h1>
        <p className="text-muted-foreground">
          Master the official curriculum. Track your progress across all board exam subjects.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Syllabus Beta</p>
            <p>
              This map is based on standard CPALE topics. Always refer to the official{" "}
              <a
                href="https://www.prc.gov.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                PRC Board of Accountancy Table of Specifications
              </a>{" "}
              for the final exam scope.
            </p>
          </div>
        </div>
      </div>

      <SyllabusView subjects={subjects || []} userId={id} />
    </div>
  );
}

