import { auth } from "../auth";
import { loadAll } from "../lib/actions";
import FinanceApp from "../src/components/FinanceApp";
import LoginPage from "../src/components/LoginPage";
import type { AllData } from "../src/types";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LoginPage />;
  }

  const data = await loadAll() as unknown as AllData;

  // @ts-ignore
  return <FinanceApp initialData={data} user={session.user} />;
}
