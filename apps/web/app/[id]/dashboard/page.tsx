import DashboardContent from "@/components/dashboard/DashboardContent";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import { getAllTasks } from "@/lib/actions/taskActionts";
import { getClassSchedule } from "@/lib/actions/scheduleActions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [enrolledSubjectsResult, tasksResult, scheduleResult] = await Promise.all([
    getEnrolledSubject(),
    getAllTasks(),
    getClassSchedule(),
  ]);

  const subjects = enrolledSubjectsResult.data?.subjects;
  const tasks =
    tasksResult.success && tasksResult.data ? tasksResult.data.allTasks : [];
  const schedule = scheduleResult.success ? scheduleResult.data : [];

  return (
    <div className="flex h-[calc(100dvh-4rem)] relative">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 overflow-hidden">
        <DashboardContent 
          initialTasks={tasks} 
          userId={id} 
          subjects={subjects}
          initialSchedule={schedule}
        />
      </div>
    </div>
  );
};

export default page;
