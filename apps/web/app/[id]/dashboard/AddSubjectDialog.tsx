// src/components/AddSubjectDialog.tsx

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddSubjectForm from "./AddSubjectForm";

const AddSubjectDialog = () => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Subject</DialogTitle>
      </DialogHeader>
      <AddSubjectForm />
    </DialogContent>
  );
};

export default AddSubjectDialog;
