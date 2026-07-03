import { loadAll } from "../../../lib/actions";
import ViewGoals from "../../../src/components/patrimonio/ViewGoals";

export default async function Page() {
  const data = await loadAll();
  return <ViewGoals initialData={data} />;
}
