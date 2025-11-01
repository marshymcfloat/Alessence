import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddTaskForm from "./AddTaskForm";

const AddTaskDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Task</DialogTitle>
      </DialogHeader>
      <AddTaskForm onClose={onClose} />
    </DialogContent>
  );
};

export default AddTaskDialog;
