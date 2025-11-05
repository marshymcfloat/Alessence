import { getAllTasks } from "@/lib/actions/taskActionts";
import { KanbanBoard } from "./KanbanBoard";

export default async function KanbanDataContainer() {
  const { data, success, error } = await getAllTasks();

  if (!success || !data) {
    return <p>{error || "Could not load tasks."}</p>;
  }

  return <KanbanBoard initialTasks={data.allTasks} />;
}
