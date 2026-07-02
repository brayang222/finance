import { loadAll } from "../../../../lib/actions";
import { ViewDetalle } from "../../../../src/components/patrimonio/StubViews";

export default async function Page({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const data = await loadAll();
  return <ViewDetalle initialData={data} ticker={decodeURIComponent(ticker)} />;
}
