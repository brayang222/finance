import { loadAll } from "../../../lib/actions";
import ViewDeudas from "../../../src/components/patrimonio/ViewDeudas";

export default async function Page() {
  const data = await loadAll();
  return <ViewDeudas initialData={data} />;
}
