import { auth } from "../auth";
import LoginPage from "../src/components/LoginPage";
import Layout from "../src/components/patrimonio/Layout";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LoginPage />;
  }

  return <Layout user={session.user} />;
}
