import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SummariesList from "./SummariesList";
import AddSummarySheet from "./AddSummarySheet";

export default function AddSummaryDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogContent className="lg:h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Add Summary</DialogTitle>
      </DialogHeader>
      <SummariesList />
      <AddSummarySheet />
    </DialogContent>
  );
}

