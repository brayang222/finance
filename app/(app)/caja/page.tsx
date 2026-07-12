import { loadAll } from "../../../lib/actions";
import ViewCaja from "../../../src/components/patrimonio/ViewCaja";

export default async function Page() {
  const data = await loadAll();
  return <ViewCaja initialData={data} />;
}
