"use client";

import { SelectValue } from "@radix-ui/react-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../ui/select";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { memo } from "react";

const SubjectSelectInput = ({
  onValueChange,
  value,
}: {
  onValueChange: (value: number | undefined) => void;
  value: number | undefined;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["enrolledSubjects"],
    queryFn: getEnrolledSubject,
  });

  const stringValue = value?.toString();

  const handleValueChange = (stringValue: string) => {
    if (stringValue === "none") {
      onValueChange(undefined);
      return;
    }
    onValueChange(Number(stringValue));
  };

  return (
    <Select value={stringValue ?? "none"} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a Subject (Optional)" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="flex justify-center p-2">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          <>
            <SelectItem value="none">None</SelectItem>

            <SelectGroup>
              <SelectLabel>Subjects</SelectLabel>
              {data?.data?.subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
};

// Memoized to prevent re-renders when parent timer updates
export default memo(SubjectSelectInput);
