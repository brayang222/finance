import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import "./blog.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header className="max-w-3xl w-full mx-auto px-5 py-6 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold no-underline" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
          Finance
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <ThemeToggle />
          <Link href="/blog" className="no-underline" style={{ color: "var(--fg)" }}>Blog</Link>
          <Link href="/herramientas" className="no-underline" style={{ color: "var(--muted)" }}>Herramientas</Link>
          <Link href="/help" className="no-underline hidden sm:inline" style={{ color: "var(--muted)" }}>Ayuda</Link>
          <Link
            href="/login"
            className="no-underline rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            Entrar
          </Link>
        </nav>
      </header>
      <main className="max-w-3xl w-full mx-auto px-5 pb-16 flex-1">{children}</main>
      <footer className="border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-3xl mx-auto px-5 py-8 flex items-center justify-between gap-4 flex-wrap text-sm" style={{ color: "var(--muted)" }}>
          <span>Finance · Finanzas personales y de tu negocio</span>
          <nav className="flex gap-4 flex-wrap">
            <Link href="/blog" className="no-underline" style={{ color: "var(--muted)" }}>Blog</Link>
            <Link href="/herramientas" className="no-underline" style={{ color: "var(--muted)" }}>Herramientas</Link>
            <Link href="/glosario" className="no-underline" style={{ color: "var(--muted)" }}>Glosario</Link>
            <Link href="/datos/salario-minimo-historico" className="no-underline" style={{ color: "var(--muted)" }}>Datos</Link>
            <Link href="/app" className="no-underline" style={{ color: "var(--muted)" }}>App</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
