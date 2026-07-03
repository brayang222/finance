import { loadAll } from "../../../lib/actions";
import { ViewCuentas } from "../../../src/components/patrimonio/StubViews";

export default async function Page() {
  const data = await loadAll();
  return <ViewCuentas initialData={data} />;
}
