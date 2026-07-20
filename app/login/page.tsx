import { redirect } from "next/navigation";
import { auth } from "../../auth";
import LoginPage from "../../src/components/LoginPage";

export const metadata = {
  title: "Entrar",
  robots: { index: false, follow: true },
};

export default async function Page() {
  const session = await auth();
  if (session) redirect("/summary");
  return <LoginPage />;
}
