import { loadAll } from "../../../lib/actions";
import { ViewInversiones } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewInversiones initialData={data} />;
}
