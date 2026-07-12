import { loadAll } from "../../../lib/actions";
import ViewProductos from "../../../src/components/patrimonio/ViewProductos";

export default async function Page() {
  const data = await loadAll();
  return <ViewProductos initialData={data} />;
}
