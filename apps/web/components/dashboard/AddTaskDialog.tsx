import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "@repo/db";
import AddTaskForm from "./AddTaskForm";

interface AddTaskDialogProps {
  onClose: () => void;
  initialData?: Task | null;
}

const AddTaskDialog = ({ onClose, initialData }: AddTaskDialogProps) => {
  const isEditMode = !!initialData;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Task" : "Add Task"}</DialogTitle>
      </DialogHeader>
      <AddTaskForm onClose={onClose} initialData={initialData} />
    </DialogContent>
  );
};

export default AddTaskDialog;
