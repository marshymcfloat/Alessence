import Link from "next/link";
import { Subject } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const EnrolledSubjectsCard = ({
  enrolledSubjects,
}: {
  enrolledSubjects: Subject[];
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Enrolled Subjects</CardTitle>
      </CardHeader>
      <CardContent>
        {enrolledSubjects && enrolledSubjects.length > 0 ? (
          <ul className="space-y-1">
            {enrolledSubjects.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/subjects/${sub.id}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {sub.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No subjects enrolled yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnrolledSubjectsCard;
