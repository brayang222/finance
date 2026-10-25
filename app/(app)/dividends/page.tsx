import { loadAll } from "../../../lib/actions";
import ViewDividendos from "../../../src/components/patrimonio/ViewDividendos";

export default async function Page() {
  const data = await loadAll();
  return <ViewDividendos initialData={data} />;
}
