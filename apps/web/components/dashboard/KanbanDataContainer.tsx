import { getAllTasks } from "@/lib/actions/taskActionts";
import KanbanSection from "./KanbanSection";

const KanbanDataContainer = async () => {
  const initialTasks = await getAllTasks();

  return (
    <>
      <KanbanSection initialData={initialTasks.data?.allTasks} />
    </>
  );
};

export default KanbanDataContainer;
