import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/LogoutButton";
import FloatingAddButton from "@/components/dashboard/FloatingAddButton";
import EnrolledSubjectsDataContainer from "@/components/dashboard/EnrolledSubjectsDataContainer";
import { Suspense } from "react";

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
      <LogoutButton />
      <FloatingAddButton />
    </div>
  );
};

export default page;
