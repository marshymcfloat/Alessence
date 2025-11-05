// your page.tsx file

import FloatingAddButton from "@/components/dashboard/FloatingAddButton";
import { Suspense } from "react";
import KanbanDataContainer from "@/components/dashboard/kanban/KanbanDataContainer";
import FloatingCardWrapper from "@/components/dashboard/FloatingCardWrapper";
import EnrolledSubjectDataContainer from "@/components/dashboard/EnrolledSubjectDataContainer";

const page = () => {
  return (
    <>
      <FloatingCardWrapper title="Enrolled Subjects">
        <EnrolledSubjectDataContainer />
      </FloatingCardWrapper>

      <div className="">
        <Suspense fallback={<h1 className="text-center">Loading tasks...</h1>}>
          <KanbanDataContainer />
        </Suspense>
      </div>
      <FloatingAddButton />
    </>
  );
};

export default page;
