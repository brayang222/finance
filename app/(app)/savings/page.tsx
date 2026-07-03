import { loadAll } from "../../../lib/actions";
import ViewHys from "../../../src/components/patrimonio/ViewHys";

export default async function Page() {
  const data = await loadAll();
  return <ViewHys initialData={data} />;
}
