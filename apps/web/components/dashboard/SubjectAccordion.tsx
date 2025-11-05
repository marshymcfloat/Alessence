"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SubjectWithTaskProgress } from "@repo/types";
import SubjectPieChart from "./SubjectPieChart";

const SubjectAccordion = ({
  subject,
}: {
  subject: SubjectWithTaskProgress;
}) => {
  return (
    <AccordionItem value={subject.id.toString()}>
      <AccordionTrigger className="capitalize font-medium hover:no-underline">
        {subject.title}
      </AccordionTrigger>
      <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="pr-4">
          <h4 className="font-semibold mb-2 text-md">Description</h4>
          <p className="text-sm text-gray-600">
            {subject.description || "No description provided."}
          </p>
        </div>
        <div className="">
          <h4 className="font-semibold mb-2 text-md">Task Progress</h4>
          <SubjectPieChart taskCounts={subject.taskCounts} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubjectAccordion;
