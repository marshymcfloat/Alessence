import FloatingAddButton from "@/components/dashboard/FloatingAddButton";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardMainContent from "@/components/dashboard/DashboardMainContent";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { Suspense } from "react";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import { getAllTasks } from "@/lib/actions/taskActionts";
import EnrolledSubjectContent from "@/components/dashboard/EnrolledSubjectContent";
import { KanbanBoard } from "@/components/dashboard/kanban/KanbanBoard";

const page = async () => {
  // Fetch data at the page level (Server Component)
  const [enrolledSubjectsResult, tasksResult] = await Promise.all([
    getEnrolledSubject(),
    getAllTasks(),
  ]);

  const subjects = enrolledSubjectsResult.data?.subjects;
  const tasks =
    tasksResult.success && tasksResult.data ? tasksResult.data.allTasks : [];

  return (
    <SidebarProvider>
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Sidebar */}
        <DashboardSidebar subjects={subjects} />

        {/* Main Content Area */}
        <DashboardMainContent>
          <DashboardContent initialTasks={tasks} />
        </DashboardMainContent>

        {/* Floating Action Button */}
        <FloatingAddButton />
      </div>
    </SidebarProvider>
  );
};

export default page;
