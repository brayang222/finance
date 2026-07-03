import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { loadAll } from "../../lib/actions";
import AppShell from "../../src/components/patrimonio/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await loadAll();
  return (
    <AppShell data={data} user={session.user}>
      {children}
    </AppShell>
  );
}
