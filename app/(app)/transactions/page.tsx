import { loadAll } from "../../../lib/actions";
import { ViewTransacciones } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewTransacciones initialData={data} />;
}
