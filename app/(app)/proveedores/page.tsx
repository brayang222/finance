import { loadAll } from "../../../lib/actions";
import ViewClientes from "../../../src/components/patrimonio/ViewClientes";

export default async function Page() {
  const data = await loadAll();
  return <ViewClientes initialData={data} kind="supplier" />;
}
