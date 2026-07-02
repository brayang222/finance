import { loadAll } from "../../../lib/actions";
import { ViewHistorico } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewHistorico initialData={data} />;
}
