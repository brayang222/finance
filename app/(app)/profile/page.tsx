import { auth, signOut } from "../../../auth";
import { redirect } from "next/navigation";
import { loadAll } from "../../../lib/actions";
import ThemeSelector from "../../../src/components/patrimonio/ThemeSelector";
import ProfileSettings from "../../../src/components/patrimonio/ProfileSettings";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const data = await loadAll();

  return (
    <div className="flex flex-col gap-4 max-w-[560px]">
      {/* User info */}
      <div className="border border-line bg-panel rounded-[18px] p-[22px] flex items-center gap-4">
        <div
          className="w-[56px] h-[56px] rounded-[14px] bg-panel2 border border-line flex items-center justify-center text-[20px] font-semibold text-muted shrink-0"
          style={{ fontFamily: "Spectral, serif" }}
        >
          {(session.user.name || "U").trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]?.toUpperCase() || "").join("")}
        </div>
        <div>
          <div className="text-[18px] font-medium" style={{ fontFamily: "Spectral, serif" }}>
            {session.user.name || "Usuario"}
          </div>
          <div className="text-[13px] text-muted mt-0.5">{session.user.email}</div>
        </div>
      </div>

      {/* Theme */}
      <div className="border border-line bg-panel rounded-[18px] p-[22px] flex flex-col gap-4">
        <div className="text-[11.5px] tracking-[0.08em] uppercase text-dim font-medium">Apariencia</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13.5px] font-medium">Tema</div>
            <div className="text-[12px] text-muted mt-0.5">Interfaz clara u oscura</div>
          </div>
          <ThemeSelector current={data.config?.theme ?? "dark"} />
        </div>
      </div>

      {/* Module toggles + categories */}
      <ProfileSettings config={data.config} categories={data.categories} />

      {/* Sign out */}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="w-full h-[42px] rounded-xl border border-line bg-panel text-neg text-[13.5px] font-medium cursor-pointer"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
