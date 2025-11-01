import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FloatingAddButton from "@/components/dashboard/FloatingAddButton";
import EnrolledSubjectsDataContainer from "@/components/dashboard/EnrolledSubjectsDataContainer";
import { Suspense } from "react";
import KanbanDataContainer from "@/components/dashboard/KanbanDataContainer";

const page = () => {
  return (
    <div>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Progress Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<h1>Loading...</h1>}>
            <EnrolledSubjectsDataContainer />
          </Suspense>
        </CardContent>
      </Card>
      <Suspense fallback={<h1>Loading...</h1>}>
        <KanbanDataContainer />
      </Suspense>

      <FloatingAddButton />
    </div>
  );
};

export default page;
