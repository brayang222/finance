import { loadAll } from "../../../lib/actions";
import ViewResumen from "../../../src/components/patrimonio/ViewResumen";
import ViewResumenComercio from "../../../src/components/patrimonio/ViewResumenComercio";

export default async function Page() {
  const data = await loadAll();
  if (data.profile === "business") return <ViewResumenComercio initialData={data} />;
  return <ViewResumen initialData={data} />;
}
