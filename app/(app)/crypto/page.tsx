import { loadAll } from "../../../lib/actions";
import { ViewCripto } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewCripto initialData={data} />;
}
