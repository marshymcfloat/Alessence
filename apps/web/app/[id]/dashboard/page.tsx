import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FloatingAddButton from "./FloatingAddButton";
import LogoutButton from "@/components/LogoutButton";

const page = () => {
  return (
    <div>
      <Card className="w-[200px]">
        <CardHeader>
          <CardTitle>Progress Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="font-medium">Subjects</h1>
          <p className="text-sm tracking-wide font-light">Taxation</p>
        </CardContent>
      </Card>
      <LogoutButton />
      <FloatingAddButton />
    </div>
  );
};

export default page;
