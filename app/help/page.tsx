import React from "react";
import Link from "next/link";

export const metadata = { title: "Ayuda · Finance" };

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="font-mono text-xs rounded-lg border px-2 py-0.5 font-medium"
      style={{ borderColor: "var(--line)", background: "var(--panel2)", color: "var(--fg)" }}
    >
      {children}
    </kbd>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-1.5 m-0 list-none p-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold mt-px"
            style={{ background: "var(--panel2)", color: "var(--muted)" }}
          >
            {i + 1}
          </span>
          <span style={{ color: "var(--muted)" }}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-sm rounded-xl px-4 py-3 m-0"
      style={{ background: "var(--panel2)", color: "var(--muted)", borderLeft: "3px solid var(--accent)" }}
    >
      {children}
    </p>
  );
}

function CodeRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex gap-2 items-start text-sm">
      <code
        className="shrink-0 rounded-lg px-2 py-0.5 font-mono text-xs"
        style={{ background: "var(--panel2)", color: "var(--fg)" }}
      >
        {cmd}
      </code>
      <span style={{ color: "var(--muted)" }}>{desc}</span>
    </div>
  );
}

const S = 16;
const ico = (d: string) => (
  <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {d.split("|").map((part, i) => {
      if (part.startsWith("circle:")) {
        const [cx, cy, r] = part.slice(7).split(",");
        return <circle key={i} cx={cx} cy={cy} r={r} />;
      }
      if (part.startsWith("rect:")) {
        const [x, y, w, h, rx] = part.slice(5).split(",");
        return <rect key={i} x={x} y={y} width={w} height={h} rx={rx ?? "0"} />;
      }
      if (part.startsWith("poly:")) return <polyline key={i} points={part.slice(5)} />;
      return <path key={i} d={part} />;
    })}
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  registro:    ico("M12 5v14|M5 12h14"),
  dictado:     ico("M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z|M19 10v2a7 7 0 0 1-14 0v-2|M12 19v4|M8 23h8"),
  cuentas:     ico("rect:2,5,20,14,2|M16 19h6|M8 19H2|M12 5v14"),
  recurrentes: ico("M1 4v6h6|M23 20v-6h-6|M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"),
  metas:       ico("circle:12,12,10|M12 8v4l3 3"),
  presupuestos:ico("M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5"),
  csv:         ico("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|poly:17 8 12 3 7 8|M12 3v13"),
  telegram:    ico("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  atajos:      ico("rect:2,3,20,14,2|M8 21h8|M12 17v4"),
  tema:        ico("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
};

const sections: { key: string; title: string; content: React.ReactNode }[] = [
  {
    key: "registro",
    title: "Registrar un movimiento",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Presiona <strong>Registrar</strong> en el header o usa el atajo <Kbd>N</Kbd> desde cualquier pantalla.
        </p>
        <Steps items={[
          "Elige Ingreso o Egreso con el toggle.",
          "Escribe el monto — puntos como separador de miles: 35.000, 1.200.000.",
          "Agrega una descripción breve (ej. Almuerzo).",
          "Selecciona la categoría. Si no existe, elige «Otro gasto» e ingresa el nombre.",
          "Ajusta la fecha si el movimiento no es de hoy.",
          "Selecciona la cuenta bancaria (opcional).",
          "Presiona Guardar.",
        ]} />
        <Note>Si repites descripciones como «Almuerzo», la categoría se sugerirá automáticamente.</Note>
      </div>
    ),
  },
  {
    key: "dictado",
    title: "Dictado por voz",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          El campo de dictado aparece en la parte superior del modal. Activa el micrófono del sistema, habla, y los campos se llenan solos.
        </p>
        <Steps items={[
          "Abre el modal de registro (botón Registrar o tecla N).",
          "Haz clic en el campo «Dicta o escribe».",
          "Activa el dictado del sistema (macOS: tecla configurada en Ajustes › Teclado › Dictado).",
          "Habla el monto y la descripción. Espera ~1 segundo a que procese.",
        ]} />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm m-0">Ejemplos:</p>
          <div className="flex flex-col gap-1.5">
            {[
              ["35.000 almuerzo",             "$35.000 · Alimentación"],
              ["ingreso de un millón salario", "Ingreso · $1.000.000 · Salario"],
              ["treinta y cinco mil taxi",     "$35.000 · Transporte"],
              ["quinientos mil arriendo",      "$500.000 · Vivienda"],
              ["egreso 80.000 farmacia",       "Egreso · $80.000 · Salud"],
            ].map(([ex, res]) => (
              <CodeRow key={ex} cmd={ex} desc={`→ ${res}`} />
            ))}
          </div>
        </div>
        <Note>«ingreso», «egreso», «compra», «recibí» cambian el tipo automáticamente. Los números pueden ser dígitos o palabras en español.</Note>
      </div>
    ),
  },
  {
    key: "cuentas",
    title: "Cuentas bancarias",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Las cuentas agrupan tu dinero y permiten ver el saldo real por banco. Ve a <strong>Cuentas</strong> en el menú.
        </p>
        <Steps items={[
          "Crea una cuenta con nombre, banco y saldo actual.",
          "Elige el tipo: Corriente, Ahorro, Efectivo, Cartera, Bolsa o Cripto.",
          "Asocia movimientos a una cuenta al registrarlos (campo opcional).",
          "El resumen «Efectivo y Bancos» suma las cuentas líquidas (excluye Bolsa y Cripto).",
        ]} />
        <Note>Las cuentas tipo Bolsa y Cripto se muestran en la sección de Inversiones, no en el KPI de Efectivo.</Note>
      </div>
    ),
  },
  {
    key: "recurrentes",
    title: "Gastos recurrentes",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Los recurrentes son movimientos que se repiten: arriendo, nómina, suscripciones. Ve a <strong>Recurrentes</strong>.
        </p>
        <Steps items={[
          "Crea un recurrente con descripción, monto, categoría y frecuencia.",
          "Frecuencias disponibles: diario, semanal, quincenal, mensual o anual.",
          "Cuando llegue la fecha, aparecerá una alerta en la app.",
          "Aplícalos con un clic — registra el movimiento y avanza la fecha.",
        ]} />
        <Note>Si tienes recurrentes vencidos al abrir la app, verás una alerta con enlace directo.</Note>
      </div>
    ),
  },
  {
    key: "metas",
    title: "Metas de ahorro",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Haz seguimiento a objetivos de ahorro: viaje, fondo de emergencia, electrodoméstico, etc.
        </p>
        <Steps items={[
          "Ve a Metas y crea una con nombre, monto objetivo y fecha límite opcional.",
          "Elige un color para identificarla visualmente.",
          "Actualiza el monto ahorrado manualmente al hacer aportes.",
          "La barra de progreso muestra cuánto llevas y cuánto falta.",
        ]} />
      </div>
    ),
  },
  {
    key: "presupuestos",
    title: "Presupuestos",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Define límites de gasto totales o por categoría. La app te avisa antes de guardar si los superarás.
        </p>
        <Steps items={[
          "Ve a Perfil › Presupuestos para configurar límites.",
          "Define presupuesto total (semanal, mensual, anual) y por categoría.",
          "Al registrar un egreso que supere el límite, verás una advertencia naranja.",
          "La advertencia no bloquea — puedes guardar igualmente.",
        ]} />
        <Note>El cálculo es en tiempo real basado en los movimientos del período actual.</Note>
      </div>
    ),
  },
  {
    key: "csv",
    title: "Importar CSV del banco",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Importa extractos bancarios en CSV. Haz clic en el ícono de carga en el header.
        </p>
        <Steps items={[
          "Descarga el extracto de tu banco en formato CSV.",
          "Haz clic en el botón de importación (↑) en el header.",
          "Sube el archivo y mapea las columnas: fecha, descripción y monto.",
          "Define el tipo por defecto y la categoría inicial.",
          "Revisa la vista previa de las primeras filas y confirma.",
        ]} />
        <Note>Los bancos colombianos suelen exportar con columnas «Fecha», «Descripción» y «Débito»/«Crédito». El importador detecta columnas automáticamente.</Note>
      </div>
    ),
  },
  {
    key: "telegram",
    title: "Bot de Telegram",
    content: (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--muted)" }} className="text-sm m-0">
          Registra movimientos directamente desde Telegram sin abrir la app.
        </p>
        <Steps items={[
          "Ve a Perfil › Bot de Telegram.",
          "Abre @FinanceTrackerBot en Telegram y usa /start para obtener tu ID.",
          "Pega tu ID en el campo y guarda.",
          "Envía mensajes al bot con el formato: monto descripción.",
        ]} />
        <div className="flex flex-col gap-1.5 mt-1">
          {[
            ["35000 almuerzo",    "Egreso $35.000 · Almuerzo"],
            ["+2500000 salario",  "Ingreso $2.500.000"],
            ["egreso 80000 taxi", "Egreso $80.000 · Taxi"],
            ["/saldo",            "Consulta tu balance actual"],
          ].map(([cmd, desc]) => (
            <CodeRow key={cmd} cmd={cmd} desc={desc} />
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "atajos",
    title: "Atajos de teclado",
    content: (
      <div className="flex flex-col gap-3">
        {[
          [["N"],           "Abrir modal de nuevo movimiento"],
          [["Cmd","K"],     "Paleta de comandos (búsqueda rápida)"],
          [["Esc"],         "Cerrar modal o paleta abierta"],
          [["Enter"],       "Aplicar dictado en el campo de voz"],
        ].map(([keys, desc]) => (
          <div key={String(keys)} className="flex items-center gap-3 text-sm">
            <div className="flex gap-1 shrink-0">
              {(keys as string[]).map(k => <Kbd key={k}>{k}</Kbd>)}
            </div>
            <span style={{ color: "var(--muted)" }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "tema",
    title: "Tema y privacidad",
    content: (
      <div className="flex flex-col gap-3">
        <Steps items={[
          "Ve a Perfil para cambiar entre tema oscuro y claro.",
          "El modo privacidad oculta los montos con asteriscos — útil al compartir pantalla.",
          "Actívalo con el botón de privacidad en el header.",
        ]} />
      </div>
    ),
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-line">
        <Link href="/" className="text-[18px] font-medium no-underline" style={{ fontFamily: "Spectral, serif", color: "var(--fg)" }}>
          Finance
        </Link>
        <Link
          href="/login"
          className="h-[36px] px-5 rounded-[10px] text-[13px] font-medium no-underline flex items-center"
          style={{ background: "var(--accent)", color: "var(--accentFg)" }}
        >
          Entrar
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 py-12 max-w-[680px] mx-auto w-full">
        <div className="mb-8">
          <h1
            className="text-2xl font-medium m-0 mb-1"
            style={{ fontFamily: "Spectral, serif" }}
          >
            Ayuda
          </h1>
          <p className="text-sm m-0" style={{ color: "var(--muted)" }}>
            Guía rápida de todas las funciones de Finance
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map(({ key, title, content }) => (
            <details
              key={key}
              className="group rounded-[18px] border overflow-hidden"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none list-none">
                <span className="shrink-0" style={{ color: "var(--dim)" }}>{ICONS[key]}</span>
                <span className="font-medium text-sm flex-1">{title}</span>
                <svg
                  className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--dim)" }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </summary>
              <div
                className="px-5 pb-5"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <div className="pt-4">{content}</div>
              </div>
            </details>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-6 px-8 py-5 border-t border-line">
        <Link href="/" className="text-[12px] no-underline" style={{ color: "var(--dim)" }}>← Inicio</Link>
        <span className="text-[12px]" style={{ color: "var(--dim)" }}>Finance · 2026</span>
        <Link href="/login" className="text-[12px] no-underline" style={{ color: "var(--dim)" }}>Entrar</Link>
      </footer>
    </div>
  );
}
