import { auth } from "../auth";
import LoginPage from "../src/components/LoginPage";
import Layout from "../src/components/patrimonio/Layout";
import { loadAll } from "../lib/actions";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LoginPage />;
  }

  const data = await loadAll();
  return <Layout user={session.user} initialData={data} />;
}
