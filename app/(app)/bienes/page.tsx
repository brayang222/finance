import { loadAll } from "../../../lib/actions";
import { ViewBienes } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewBienes initialData={data} />;
}
