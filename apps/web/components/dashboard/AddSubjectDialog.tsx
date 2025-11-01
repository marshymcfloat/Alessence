import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddSubjectForm from "./AddSubjectForm";

const AddSubjectDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Subject</DialogTitle>
      </DialogHeader>
      <AddSubjectForm onClose={onClose} />
    </DialogContent>
  );
};

export default AddSubjectDialog;
