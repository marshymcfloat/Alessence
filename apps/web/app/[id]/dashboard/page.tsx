import DashboardContent from "@/components/dashboard/DashboardContent";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import { getAllTasks } from "@/lib/actions/taskActionts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  // Await params in Next.js 16
  const { id } = await params;

  // Fetch data at the page level (Server Component)
  const [enrolledSubjectsResult, tasksResult] = await Promise.all([
    getEnrolledSubject(),
    getAllTasks(),
  ]);

  const subjects = enrolledSubjectsResult.data?.subjects;
  const tasks =
    tasksResult.success && tasksResult.data ? tasksResult.data.allTasks : [];

  return (
    <div className="flex h-[calc(100dvh-4rem)] relative">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 overflow-hidden">
        <DashboardContent initialTasks={tasks} userId={id} subjects={subjects} />
      </div>
    </div>
  );
};

export default page;
