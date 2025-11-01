import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddTaskForm from "./AddTaskForm";

const AddTaskDialog = () => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Task</DialogTitle>
      </DialogHeader>
      <AddTaskForm />
    </DialogContent>
  );
};

export default AddTaskDialog;
