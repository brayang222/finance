import { loadAll } from "../../../lib/actions";
import ViewResumen from "../../../src/components/patrimonio/ViewResumen";

export default async function Page() {
  const data = await loadAll();
  return <ViewResumen initialData={data} />;
}
