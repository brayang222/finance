import { loadAll } from "../../../lib/actions";
import ViewRecurrentes from "../../../src/components/patrimonio/ViewRecurrentes";

export default async function Page() {
  const data = await loadAll();
  return <ViewRecurrentes initialData={data} />;
}
