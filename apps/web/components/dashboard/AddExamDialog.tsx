import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExamsList from "./ExamsList";
import AddExamSheet from "./AddExamSheet";

export default function AddExamDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogContent className="lg:h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Add exam</DialogTitle>
      </DialogHeader>
      <ExamsList />
      <AddExamSheet />
    </DialogContent>
  );
}
