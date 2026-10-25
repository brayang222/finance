import { loadAll } from "../../../lib/actions";
import ViewFiscal from "../../../src/components/patrimonio/ViewFiscal";

export default async function Page() {
  const data = await loadAll();
  return <ViewFiscal initialData={data} />;
}
