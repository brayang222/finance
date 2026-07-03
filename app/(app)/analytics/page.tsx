import { loadAll } from "../../../lib/actions";
import { ViewAnalytics } from "../../../src/components/patrimonio/ViewAnalytics";

export default async function Page() {
  const data = await loadAll();
  return <ViewAnalytics initialData={data} />;
}
