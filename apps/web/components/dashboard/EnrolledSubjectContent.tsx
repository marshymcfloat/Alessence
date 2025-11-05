"use client";

import { SubjectWithTaskProgress } from "@repo/types";
import SubjectAccordion from "./SubjectAccordion";
import { Accordion } from "@/components/ui/accordion";

const EnrolledSubjectContent = ({
  data,
}: {
  data: SubjectWithTaskProgress[] | undefined;
}) => {
  console.log(data);
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>You are not enrolled in any subjects yet.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {data?.map((subject) => (
        <SubjectAccordion key={subject.id} subject={subject} />
      ))}
    </Accordion>
  );
};

export default EnrolledSubjectContent;
