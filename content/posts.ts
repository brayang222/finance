// Blog: una entrada por cada pregunta financiera frecuente del colombiano.
// Contenido estático — agregar un post = agregar un objeto a este array.

export const SITE_URL = "https://financials-app.vercel.app";

export type Post = {
  slug: string;
  title: string; // la pregunta (H1 y <title>)
  description: string; // meta description ≤155 chars
  keywords: string[];
  date: string; // publicado (ISO)
  category: string;
  minutes: number;
  faqs: { q: string; a: string }[]; // se renderizan y alimentan el schema FAQPage
  html: string; // cuerpo del artículo (h2/p/ul/ol/table)
};

export const posts: Post[] = [
  {
    slug: "cuanto-es-el-salario-minimo-2026-en-colombia",
    title: "¿Cuánto es el salario mínimo en Colombia en 2026?",
    description:
      "El salario mínimo 2026 en Colombia es $1.750.905 más $249.095 de auxilio de transporte: $2.000.000 en total. Te explicamos qué significa para tu bolsillo.",
    keywords: ["salario mínimo 2026", "salario mínimo colombia", "auxilio de transporte 2026", "smmlv 2026"],
    date: "2026-07-18",
    category: "Ingresos",
    minutes: 4,
    faqs: [
      { q: "¿Cuánto queda el salario mínimo quincenal en 2026?", a: "La quincena del salario mínimo 2026 es de $875.453. Sumando la mitad del auxilio de transporte ($124.548), un trabajador recibe cerca de $1.000.000 por quincena." },
      { q: "¿El auxilio de transporte cuenta para prima y cesantías?", a: "Sí. El auxilio de transporte se incluye en la base para calcular prima de servicios y cesantías, pero no para los aportes a salud y pensión." },
      { q: "¿Cuánto subió el salario mínimo frente a 2025?", a: "Pasó de $1.423.500 a $1.750.905, un aumento del 23%. El auxilio de transporte subió de $200.000 a $249.095." },
    ],
    html: `
<p>Para 2026 el salario mínimo mensual legal vigente (SMMLV) en Colombia quedó en <strong>$1.750.905</strong>, y el auxilio de transporte en <strong>$249.095</strong>. Es decir, un trabajador que gana el mínimo recibe <strong>$2.000.000 mensuales</strong> en total, según los decretos 1469 y 1470 de diciembre de 2025.</p>
<h2>Valores del salario mínimo 2026</h2>
<table><thead><tr><th>Concepto</th><th>Valor 2026</th></tr></thead><tbody>
<tr><td>Salario mínimo mensual</td><td>$1.750.905</td></tr>
<tr><td>Auxilio de transporte</td><td>$249.095</td></tr>
<tr><td>Total con auxilio</td><td>$2.000.000</td></tr>
<tr><td>Salario mínimo diario</td><td>$58.364</td></tr>
</tbody></table>
<p>El auxilio de transporte aplica solo para quienes ganan hasta dos salarios mínimos ($3.501.810).</p>
<h2>La jornada laboral también cambió</h2>
<p>Desde julio de 2026 la jornada máxima legal bajó a <strong>42 horas semanales</strong> (última etapa de la Ley 2101 de 2021). Como el sueldo mensual no cambia, el valor de cada hora de trabajo sube, y con él las horas extra y los recargos.</p>
<h2>Qué significa para tu bolsillo</h2>
<ul>
<li><strong>Aportes:</strong> como empleado aportas 4% a salud y 4% a pensión sobre el salario (sin auxilio): unos $140.072 mensuales si ganas el mínimo.</li>
<li><strong>Prestaciones:</strong> prima, cesantías e intereses se calculan sobre salario más auxilio de transporte.</li>
<li><strong>Referencia de precios:</strong> multas, cuotas moderadoras y muchos trámites están atados al SMMLV, así que también subieron.</li>
</ul>
<p>Si tu ingreso es el mínimo, cada peso cuenta: registrar tus gastos diarios es el primer paso para que el aumento no se diluya sin darte cuenta.</p>`,
  },
  {
    slug: "quienes-deben-declarar-renta-en-2026",
    title: "¿Quién debe declarar renta en Colombia en 2026?",
    description:
      "Declaras renta en 2026 si en 2025 tus ingresos superaron $69.718.600, tu patrimonio $224.095.500 o tus consignaciones $69.718.600. Topes y fechas aquí.",
    keywords: ["declaración de renta 2026", "quiénes declaran renta", "topes declaración renta", "DIAN 2026"],
    date: "2026-07-18",
    category: "Impuestos",
    minutes: 5,
    faqs: [
      { q: "¿Declarar renta significa pagar impuesto?", a: "No necesariamente. Muchos declarantes no pagan nada porque las retenciones que ya les hicieron cubren el impuesto, o porque su renta líquida queda por debajo del mínimo gravado. Declarar es informar; pagar depende del cálculo." },
      { q: "¿Qué pasa si estoy obligado y no declaro?", a: "La DIAN puede cobrar sanción por extemporaneidad: 5% del impuesto por cada mes de retraso, con una sanción mínima de 10 UVT ($523.740 en 2026)." },
      { q: "¿Cuándo son los plazos en 2026?", a: "El calendario de la DIAN para personas naturales va entre agosto y octubre de 2026, según los dos últimos dígitos de tu cédula. Consulta la fecha exacta en dian.gov.co." },
    ],
    html: `
<p>En 2026 declaras renta por el <strong>año gravable 2025</strong>. Estás obligado si en 2025 cumpliste <strong>al menos uno</strong> de estos topes (UVT 2025 = $49.799):</p>
<table><thead><tr><th>Condición en 2025</th><th>Tope</th></tr></thead><tbody>
<tr><td>Ingresos brutos del año</td><td>≥ $69.718.600 (1.400 UVT)</td></tr>
<tr><td>Patrimonio bruto al 31 de diciembre</td><td>≥ $224.095.500 (4.500 UVT)</td></tr>
<tr><td>Compras y consumos totales</td><td>≥ $69.718.600</td></tr>
<tr><td>Consumos con tarjeta de crédito</td><td>≥ $69.718.600</td></tr>
<tr><td>Consignaciones, depósitos o inversiones</td><td>≥ $69.718.600</td></tr>
<tr><td>Ser responsable de IVA</td><td>Aplica siempre</td></tr>
</tbody></table>
<p>Ojo con el tope de consignaciones: mover plata entre tus propias cuentas o recibir transferencias de terceros suma. Un ingreso mensual de unos $5.800.000 ya te acerca al tope de ingresos.</p>
<h2>Cómo prepararte sin estrés</h2>
<ul>
<li>Descarga el <strong>reporte de terceros</strong> en la página de la DIAN: ahí ves lo que bancos y empresas reportaron de ti.</li>
<li>Reúne certificados: ingresos y retenciones, aportes a salud y pensión, intereses de vivienda, dependientes.</li>
<li>Si tienes cuentas, CDT o billeteras en varias entidades, revisa los extractos de diciembre: el patrimonio bruto se mide al 31 de diciembre.</li>
<li>Llevar tus finanzas registradas todo el año hace que la declaración sea un trámite de una tarde, no una crisis.</li>
</ul>
<h2>Declarar no siempre es pagar</h2>
<p>Si eres asalariado, es probable que tus retenciones ya cubran el impuesto y tu saldo a pagar sea cero, o incluso tengas saldo a favor. Lo importante es presentar la declaración a tiempo para evitar sanciones.</p>`,
  },
  {
    slug: "como-mejorar-el-puntaje-en-datacredito",
    title: "¿Cómo mejorar mi puntaje en Datacrédito?",
    description:
      "Tu puntaje en Datacrédito va de 150 a 950. Aprende a consultarlo gratis, qué lo sube, qué lo baja y cuánto dura un reporte negativo en Colombia.",
    keywords: ["puntaje datacrédito", "mejorar score crediticio", "reporte negativo datacrédito", "historial crediticio colombia"],
    date: "2026-07-18",
    category: "Crédito",
    minutes: 5,
    faqs: [
      { q: "¿Consultar mi propio puntaje lo baja?", a: "No. Consultar tu propia información es un derecho gratuito (habeas data) y no afecta el puntaje. Lo que sí pesa son muchas solicitudes de crédito en poco tiempo hechas por entidades." },
      { q: "¿Cuánto dura un reporte negativo?", a: "El dato negativo permanece el doble del tiempo de la mora, con un máximo de 4 años contados desde que pagas. Si la mora fue corta, el castigo también lo es." },
      { q: "¿Las empresas que prometen 'limpiar' tu historial funcionan?", a: "No. Nadie puede borrar un reporte verídico. Solo se elimina información errónea (vía reclamo gratuito) o al cumplirse el término legal. Pagar por 'limpiar' el historial es tirar la plata o caer en estafa." },
    ],
    html: `
<p>El puntaje de Datacrédito va de <strong>150 a 950</strong>. Por encima de ~700 los bancos te ven como buen pagador y te ofrecen mejores tasas. Puedes consultarlo <strong>gratis</strong> en midatacredito.com o a través de tu banco.</p>
<h2>Qué sube (y qué baja) tu puntaje</h2>
<ul>
<li><strong>Hábito de pago:</strong> es el factor que más pesa. Una sola cuota en mora te castiga más de lo que crees; pagar a tiempo durante meses te recupera.</li>
<li><strong>Nivel de endeudamiento:</strong> usar más del 30-40% del cupo de tus tarjetas de forma permanente baja el score, incluso si pagas a tiempo.</li>
<li><strong>Antigüedad:</strong> un historial largo y sano vale oro. No canceles tu tarjeta más vieja sin necesidad.</li>
<li><strong>Solicitudes recientes:</strong> pedir varios créditos en pocas semanas te hace ver necesitado de liquidez.</li>
</ul>
<h2>Plan de 6 meses para subirlo</h2>
<ol>
<li>Consulta tu reporte y <strong>disputa cualquier error</strong>: el reclamo es gratuito y deben responderte en 15 días hábiles.</li>
<li>Ponte al día en moras pequeñas primero: el reporte negativo empieza a "vencer" desde que pagas.</li>
<li>Baja la utilización de tus tarjetas por debajo del 30% del cupo.</li>
<li>Automatiza los pagos mínimos para nunca más caer en mora por olvido.</li>
<li>Si no tienes historial, empieza con un producto pequeño (tarjeta de cupo bajo o plan celular pospago) y páualo religiosamente.</li>
</ol>
<p>Registrar tus fechas de pago y cuotas en una app de finanzas evita la causa #1 de reportes: el simple olvido.</p>`,
  },
  {
    slug: "como-salir-de-deudas",
    title: "¿Cómo salir de deudas rápido en Colombia?",
    description:
      "Método paso a paso para salir de deudas: bola de nieve vs avalancha, compra de cartera, negociación con bancos y por qué nunca caer en el gota a gota.",
    keywords: ["cómo salir de deudas", "bola de nieve deudas", "compra de cartera", "negociar deudas colombia"],
    date: "2026-07-18",
    category: "Deudas",
    minutes: 5,
    faqs: [
      { q: "¿Bola de nieve o avalancha: cuál es mejor?", a: "Matemáticamente la avalancha (atacar la tasa más alta) ahorra más intereses. En la práctica, la bola de nieve (atacar el saldo más pequeño) funciona mejor para la mayoría porque los triunfos rápidos mantienen la motivación." },
      { q: "¿Qué es una compra de cartera?", a: "Otro banco paga tu deuda actual y te la queda a una tasa menor. Es de las formas más efectivas de bajar intereses de tarjetas de crédito. Compara la tasa efectiva anual y pregunta por costos de estudio antes de firmar." },
      { q: "¿Si estoy reportado puedo negociar?", a: "Sí. Los bancos prefieren recuperar algo a perderlo todo: pide acuerdos de pago, condonación parcial de intereses o reestructuración. Todo acuerdo debe quedar por escrito." },
    ],
    html: `
<p>Salir de deudas no es cuestión de ganar más sino de <strong>método</strong>. Este es el plan que funciona:</p>
<h2>1. Haz la lista completa (sin miedo)</h2>
<p>Anota cada deuda con su saldo, tasa efectiva anual y cuota mínima. Tarjetas, créditos de libre inversión, codeudas, fiados, familiares. Lo que no se mide no se paga.</p>
<h2>2. Paga mínimos de todas y ataca una</h2>
<ul>
<li><strong>Bola de nieve:</strong> ataca primero la de menor saldo. Cada deuda que eliminas libera cuota para la siguiente.</li>
<li><strong>Avalancha:</strong> ataca primero la de mayor tasa (casi siempre las tarjetas de crédito). Es la que menos intereses paga en total.</li>
</ul>
<h2>3. Baja el costo de la deuda</h2>
<p>Pide <strong>compra de cartera</strong> a otra entidad con mejor tasa, o negocia directamente: reestructuración, rebaja de intereses o acuerdo de pago. Si la deuda está muy vencida, las casas de cobranza suelen aceptar descuentos grandes por pago de contado.</p>
<h2>4. Cierra la llave</h2>
<p>Mientras pagas, no adquieras deuda nueva: congela las tarjetas (literalmente si hace falta) y vive con presupuesto. Un registro diario de gastos te muestra de dónde sacar $100.000 o $200.000 extra mensuales para acelerar el plan.</p>
<h2>Nunca, nunca el gota a gota</h2>
<p>El "préstamo fácil" del gota a gota cobra tasas superiores al 400% anual y cobra con violencia. Si estás ahogado, antes de eso: fondos de empleados, cooperativas, avances de nómina o renegociar con el banco. Siempre hay una opción legal mejor.</p>`,
  },
  {
    slug: "que-es-un-cdt-y-cuanto-rinde",
    title: "¿Qué es un CDT y cuánto rinde en Colombia?",
    description:
      "Un CDT es un depósito a plazo fijo con rentabilidad garantizada. Aprende a comparar tasas E.A., qué retención aplica y cómo elegir plazo y entidad.",
    keywords: ["qué es un cdt", "cdt rentabilidad", "mejores cdt colombia", "invertir en cdt"],
    date: "2026-07-18",
    category: "Inversión",
    minutes: 4,
    faqs: [
      { q: "¿Puedo retirar la plata de un CDT antes del plazo?", a: "En general no: el dinero queda inmovilizado hasta el vencimiento. Algunas entidades permiten venderlo (endosarlo) o cancelarlo con penalidad. Si crees que necesitarás la plata, elige un plazo corto o un fondo de inversión colectiva." },
      { q: "¿Qué pasa si el banco quiebra?", a: "Los CDT en bancos vigilados están amparados por el seguro de depósitos de Fogafín hasta $50.000.000 por persona y por entidad. Si inviertes más, reparte entre entidades." },
      { q: "¿Los rendimientos del CDT pagan impuestos?", a: "Sí: la entidad aplica retención en la fuente sobre los intereses ganados, y si estás obligado a declarar renta, los rendimientos hacen parte de tus ingresos." },
    ],
    html: `
<p>Un CDT (Certificado de Depósito a Término) es un depósito a <strong>plazo fijo</strong>: le entregas tu plata a un banco por 30, 90, 180 o 360 días y al final te la devuelve con una <strong>rentabilidad pactada desde el día uno</strong>. Es de las inversiones más seguras que existen en Colombia.</p>
<h2>Cómo comparar CDTs (lo único que importa)</h2>
<ul>
<li><strong>Tasa E.A. (efectiva anual):</strong> es el número para comparar entre entidades. No te dejes confundir con tasas nominales o periódicas.</li>
<li><strong>Plazo:</strong> a mayor plazo, generalmente mejor tasa. Las tasas siguen la política del Banco de la República: cuando bajan las tasas de referencia, bajan las de los CDT.</li>
<li><strong>Entidad:</strong> bancos digitales y compañías de financiamiento suelen pagar más que los bancos grandes por el mismo plazo. Verifica que esté vigilada por la Superfinanciera.</li>
</ul>
<h2>Ejemplo práctico</h2>
<p>Si inviertes $5.000.000 a 12 meses con una tasa del 9% E.A., recibes unos $450.000 de intereses antes de retención. La clave: esa cifra está garantizada, no depende del mercado.</p>
<h2>¿CDT o cuenta de ahorros remunerada?</h2>
<p>La cuenta remunerada paga menos pero tienes la plata disponible; el CDT paga más pero la inmoviliza. Una estrategia común es el <strong>escalonamiento</strong>: dividir el ahorro en varios CDT con vencimientos distintos (90, 180, 360 días) para tener liquidez periódica sin sacrificar toda la tasa.</p>`,
  },
  {
    slug: "como-ahorrar-si-gano-el-salario-minimo",
    title: "¿Cómo ahorrar si gano el salario mínimo?",
    description:
      "Sí se puede ahorrar ganando el mínimo: regla 50/30/20 adaptada a Colombia, ahorro automático y control de gastos hormiga con ejemplos en pesos.",
    keywords: ["ahorrar con salario mínimo", "cómo ahorrar en colombia", "regla 50 30 20", "gastos hormiga"],
    date: "2026-07-18",
    category: "Ahorro",
    minutes: 4,
    faqs: [
      { q: "¿Cuánto debería ahorrar al mes ganando el mínimo?", a: "Empieza con lo sostenible: 5% del ingreso ($100.000 sobre $2.000.000) ya construye el hábito. La meta de mediano plazo es llegar al 10-20%. Un ahorro pequeño y constante le gana a uno grande que abandonas al segundo mes." },
      { q: "¿Dónde guardo el ahorro para que no se lo coma la inflación?", a: "En una cuenta de ahorros remunerada o un fondo de inversión de bajo riesgo mientras armas el fondo de emergencia; después, CDTs para metas con fecha. Lo importante: separado de la cuenta donde gastas." },
      { q: "¿Qué son los gastos hormiga?", a: "Compras pequeñas y frecuentes que no registras: domicilios, mecato, apps, 'una gaseosita'. Sumadas pueden ser $150.000-$300.000 al mes. Registrarlas es la forma más rápida de recuperarlas." },
    ],
    html: `
<p>Con el salario mínimo 2026 ($2.000.000 incluyendo auxilio de transporte) ahorrar es difícil pero <strong>no imposible</strong>. La diferencia la hacen tres hábitos: automatizar, registrar y empezar pequeño.</p>
<h2>La regla 50/30/20 aterrizada a Colombia</h2>
<table><thead><tr><th>Destino</th><th>%</th><th>Sobre $2.000.000</th></tr></thead><tbody>
<tr><td>Necesidades (arriendo, mercado, transporte, servicios)</td><td>50-60%</td><td>$1.000.000 - $1.200.000</td></tr>
<tr><td>Gustos (salidas, ropa, streaming)</td><td>20-30%</td><td>$400.000 - $600.000</td></tr>
<tr><td>Ahorro y deudas</td><td>10-20%</td><td>$200.000 - $400.000</td></tr>
</tbody></table>
<p>Si el arriendo se come más del 60%, el ajuste no saldrá de los porcentajes sino de decisiones grandes: compartir vivienda, renegociar, moverse. Los porcentajes son guía, no ley.</p>
<h2>Tres trucos que sí funcionan</h2>
<ol>
<li><strong>Ahorra el día de pago, no lo que sobre:</strong> programa una transferencia automática a otra cuenta apenas te consignen. Lo que no ves, no lo gastas.</li>
<li><strong>Registra todo por 30 días:</strong> los gastos hormiga (domicilios, mecato, recargas) suelen sumar más de $150.000 al mes. No se trata de eliminarlos, sino de elegirlos conscientemente.</li>
<li><strong>Metas con nombre y fecha:</strong> "ahorrar" no motiva; "$600.000 para la moto en diciembre" sí. Divide la meta entre los meses y vuélvela una cuota más.</li>
</ol>
<p>El primer objetivo siempre es un colchón de emergencia, aunque sea de $500.000: es lo que evita que cualquier imprevisto te devuelva a la deuda.</p>`,
  },
  {
    slug: "que-es-bre-b-y-como-funciona",
    title: "¿Qué es Bre-B y cómo funciona?",
    description:
      "Bre-B es el sistema de pagos inmediatos de Colombia: transferencias entre bancos y billeteras en segundos, 24/7, usando llaves. Guía completa.",
    keywords: ["qué es bre-b", "llaves bre-b", "transferencias inmediatas colombia", "bre-b como funciona"],
    date: "2026-07-18",
    category: "Bancos digitales",
    minutes: 4,
    faqs: [
      { q: "¿Bre-B tiene costo?", a: "Para personas naturales, las transferencias por Bre-B son gratuitas en la gran mayoría de entidades. Los cobros que se han discutido públicamente aplican a otro tipo de operaciones; revisa las condiciones de tu banco." },
      { q: "¿Qué puedo usar como llave?", a: "Tu número de celular, tu cédula, tu correo electrónico o una llave alfanumérica que tú elijas. Cada llave se vincula a una sola cuenta, pero puedes tener varias llaves en distintas entidades." },
      { q: "¿Bre-B reemplaza a Nequi o Daviplata?", a: "No: las conecta. Bre-B es la infraestructura del Banco de la República que permite que cualquier banco o billetera se transfiera con cualquier otro en segundos, sin importar la entidad." },
    ],
    html: `
<p>Bre-B es el sistema de <strong>pagos inmediatos</strong> creado por el Banco de la República, en funcionamiento desde 2025. Permite enviar plata entre <strong>cualquier banco o billetera</strong> del país en segundos, las 24 horas, todos los días — sin esperar los tiempos de una transferencia tradicional.</p>
<h2>¿Cómo funcionan las llaves?</h2>
<p>En vez de pedir número de cuenta, tipo de cuenta y banco, con Bre-B envías dinero a una <strong>llave</strong>: el celular, la cédula, el correo o un alias del destinatario. Registras tus llaves una sola vez en la app de tu banco o billetera, y quien te quiera pagar solo necesita una de ellas.</p>
<h2>Cómo empezar a usarlo</h2>
<ol>
<li>Abre la app de tu banco o billetera y busca la sección Bre-B o "Llaves".</li>
<li>Registra la llave que prefieras (una llave = una cuenta destino).</li>
<li>Para enviar: elige Bre-B, escribe la llave del destinatario, confirma nombre y monto, y listo — la plata llega en segundos.</li>
</ol>
<h2>Seguridad: lo que debes saber</h2>
<ul>
<li>Antes de confirmar, la app te muestra el <strong>nombre del titular</strong> de la llave: verifícalo siempre.</li>
<li>Una transferencia inmediata es <strong>irreversible</strong>: si te equivocas de llave o te engañan, recuperar la plata depende de la buena fe del receptor y de la gestión del banco.</li>
<li>Nadie de tu banco te pedirá claves ni códigos por teléfono para "activar Bre-B". Eso es estafa.</li>
</ul>
<p>Para un negocio pequeño, cobrar por Bre-B significa recibir el pago al instante y sin datáfono: pide a tus clientes tu llave y registra cada venta en el momento.</p>`,
  },
  {
    slug: "como-hacer-un-presupuesto-personal",
    title: "¿Cómo hacer un presupuesto personal que sí funcione?",
    description:
      "Guía práctica en 4 pasos para hacer tu presupuesto mensual: ingresos reales, gastos fijos y variables, límites por categoría y revisión semanal.",
    keywords: ["presupuesto personal", "cómo hacer un presupuesto", "presupuesto mensual", "finanzas personales colombia"],
    date: "2026-07-18",
    category: "Ahorro",
    minutes: 4,
    faqs: [
      { q: "¿Cada cuánto debo revisar el presupuesto?", a: "Una vez por semana, 10 minutos. La revisión mensual llega demasiado tarde para corregir; la semanal te deja ajustar sobre la marcha." },
      { q: "¿Presupuesto en Excel, papel o app?", a: "El mejor es el que realmente uses. Una app tiene la ventaja de registrar el gasto en el momento (fila del almuerzo, bus, domicilio); Excel exige disciplina de sentarte a llenarlo después, y ahí es donde la mayoría abandona." },
      { q: "¿Qué hago si mis ingresos son variables?", a: "Presupuesta sobre tu mes malo, no sobre el promedio. Lo que entre por encima va directo a ahorro o deudas. Así los meses flojos no te descuadran." },
    ],
    html: `
<p>Un presupuesto no es una camisa de fuerza: es saber <strong>a dónde va tu plata antes de que se vaya</strong>. Cuatro pasos:</p>
<h2>1. Calcula tu ingreso real</h2>
<p>Lo que efectivamente te llega al bolsillo después de descuentos de nómina. Si tienes ingresos variables (independiente, negocio), usa tu mes más flojo como base.</p>
<h2>2. Lista los gastos fijos</h2>
<p>Arriendo, servicios, mercado base, transporte, cuotas de deudas, planes de celular. Estos salen primero y no se negocian mes a mes. Réstalos del ingreso: lo que queda es tu plata "de decisión".</p>
<h2>3. Ponle techo a lo variable</h2>
<p>Salidas, domicilios, ropa, gustos: asígnales un monto máximo por categoría. No importa si el techo es generoso al principio — lo que importa es que exista y lo veas al gastar.</p>
<h2>4. Registra en el momento y revisa semanal</h2>
<p>El presupuesto muere cuando dejas de registrar. La regla de oro: <strong>anota el gasto cuando lo haces</strong>, no al final del día ni del mes. Diez minutos cada domingo bastan para ver qué categoría va apretada y ajustar a tiempo.</p>
<h2>Errores que matan presupuestos</h2>
<ul>
<li>Hacerlo demasiado detallado (30 categorías): abandono garantizado. Empieza con 6-8.</li>
<li>No incluir un rubro "imprevistos": siempre pasa algo; presupuéstalo.</li>
<li>Castigarte por fallar un mes: el presupuesto se ajusta, no se abandona.</li>
</ul>
<p>Herramientas como <strong>Finance</strong> te dejan registrar cada gasto en segundos, ver presupuestos por categoría y recibir alertas antes de pasarte — la parte aburrida, automatizada.</p>`,
  },
  {
    slug: "que-es-el-4x1000-y-como-evitarlo",
    title: "¿Qué es el 4x1000 y cómo evitarlo legalmente?",
    description:
      "El 4x1000 cobra $4 por cada $1.000 que muevas. Aprende a marcar tu cuenta exenta (hasta $18.330.900 mensuales en 2026) y evitar el cobro legalmente.",
    keywords: ["4x1000", "gravamen movimientos financieros", "cuenta exenta 4x1000", "evitar 4x1000"],
    date: "2026-07-18",
    category: "Impuestos",
    minutes: 3,
    faqs: [
      { q: "¿Cuánto me cobran de 4x1000 por retirar $1.000.000?", a: "$4.000. El gravamen es del 0,4% sobre cada retiro o transferencia desde cuentas no exentas." },
      { q: "¿Puedo marcar como exenta mi cuenta de Nequi o Daviplata?", a: "Sí. Las billeteras digitales también permiten marcar la cuenta como exenta del 4x1000, con el mismo límite mensual. Solo puedes tener una cuenta exenta en todo el sistema financiero." },
      { q: "¿Las compras con tarjeta de crédito pagan 4x1000?", a: "No: la compra en sí no genera el gravamen. El 4x1000 se causa cuando pagas la tarjeta desde una cuenta no exenta, o al hacer avances." },
    ],
    html: `
<p>El 4x1000 (Gravamen a los Movimientos Financieros, GMF) es un impuesto del <strong>0,4%</strong> que se cobra cada vez que sacas plata de una cuenta: retiros, transferencias, pagos. Por cada $1.000.000 que muevas, $4.000 se van en el impuesto.</p>
<h2>La forma legal de no pagarlo</h2>
<p>Todo colombiano puede marcar <strong>una única cuenta</strong> (de ahorros, corriente o billetera digital) como <strong>exenta del 4x1000</strong>. En 2026 la exención cubre movimientos hasta <strong>350 UVT mensuales: $18.330.900</strong>. Por encima de ese monto en el mes, el excedente sí paga.</p>
<ol>
<li>Elige la cuenta por donde más mueves plata (nómina o la billetera del día a día).</li>
<li>Pídele a la entidad marcarla como exenta: se hace desde la app o en oficina, gratis, en minutos.</li>
<li>Recuerda: solo una cuenta exenta <em>en todo el sistema</em>. Si marcas una nueva, desmarcas la anterior.</li>
</ol>
<h2>Otros movimientos que no pagan GMF</h2>
<ul>
<li>Traslados entre <strong>tus propias cuentas en la misma entidad</strong>.</li>
<li>Compras con tarjeta débito o crédito (el impuesto se causa al retirar o transferir, no al comprar).</li>
<li>Retiros de cesantías y de la cuenta de ahorro programado para vivienda.</li>
</ul>
<p>Un error común: tener la cuenta exenta en un banco que casi no usas. Revisa por dónde se mueve realmente tu plata — cambiar la marca de cuenta puede ahorrarte varios cientos de miles de pesos al año.</p>`,
  },
  {
    slug: "cuanto-debo-tener-en-un-fondo-de-emergencia",
    title: "¿Cuánto debo tener en un fondo de emergencia?",
    description:
      "La meta: 3 a 6 meses de tus gastos esenciales. Te mostramos cómo calcularlo, dónde guardarlo para que rente y cómo construirlo desde cero.",
    keywords: ["fondo de emergencia", "cuánto ahorrar fondo emergencia", "colchón financiero", "ahorro de emergencia"],
    date: "2026-07-18",
    category: "Ahorro",
    minutes: 3,
    faqs: [
      { q: "¿3 o 6 meses de gastos?", a: "Empleado con contrato estable: 3 meses puede bastar. Independiente, ingresos variables o familia que depende de ti: apunta a 6. Lo que cubre el fondo es el tiempo que tardarías en recuperar tus ingresos." },
      { q: "¿El fondo de emergencia se invierte?", a: "Se guarda en instrumentos líquidos y de bajo riesgo: cuenta remunerada o fondo de inversión conservador. No en acciones ni cripto — cuando lo necesites, no puedes esperar a que 'se recupere el mercado'." },
      { q: "¿Qué cuenta como emergencia?", a: "Pérdida del empleo, salud, daño del vehículo que usas para trabajar, arreglo urgente de vivienda. No cuenta: promociones, viajes, ni 'estaba barato'." },
    ],
    html: `
<p>La regla: tu fondo de emergencia debe cubrir entre <strong>3 y 6 meses de tus gastos esenciales</strong> — no de tu sueldo. Es la diferencia entre un imprevisto y una crisis de deudas.</p>
<h2>Cálculo en 2 minutos</h2>
<p>Suma lo mínimo con lo que vives un mes: arriendo, mercado, servicios, transporte, salud, cuotas. Si son $1.500.000, tu meta está entre <strong>$4.500.000 y $9.000.000</strong>. Esa cifra puede asustar — por eso se construye por etapas:</p>
<ol>
<li><strong>Meta 1 — $500.000:</strong> cubre la mayoría de imprevistos pequeños sin tocar la tarjeta.</li>
<li><strong>Meta 2 — 1 mes de gastos:</strong> ya duermes distinto.</li>
<li><strong>Meta 3 — 3 a 6 meses:</strong> libertad real para decidir (cambiar de trabajo, aguantar un mes malo del negocio).</li>
</ol>
<h2>Dónde guardarlo</h2>
<ul>
<li><strong>Cuenta de ahorros remunerada</strong> o fondo de inversión conservador: disponible en horas y rentando algo.</li>
<li><strong>Separado de tu cuenta de gastos:</strong> si lo ves junto al resto, te lo gastas. Idealmente en otra entidad.</li>
<li>Parte del fondo (la de los meses 3-6) puede ir en CDTs cortos escalonados para mejor tasa.</li>
</ul>
<p>Automatiza un aporte fijo el día de pago, aunque sean $50.000. El fondo de emergencia es la primera meta de cualquier plan financiero — antes de invertir, antes de la moto, antes de todo.</p>`,
  },
  {
    slug: "cuando-pagan-la-prima-y-como-se-calcula",
    title: "¿Cuándo pagan la prima y cómo se calcula?",
    description:
      "La prima se paga máximo el 30 de junio y el 20 de diciembre. Fórmula exacta, ejemplo con salario mínimo 2026 y qué hacer para que no se esfume.",
    keywords: ["prima de servicios", "cuándo pagan la prima", "cómo se calcula la prima", "prima diciembre"],
    date: "2026-07-18",
    category: "Ingresos",
    minutes: 3,
    faqs: [
      { q: "¿Si llevo 3 meses en la empresa me pagan prima?", a: "Sí, proporcional: se calcula sobre los días trabajados del semestre. Con 90 días trabajados recibes la cuarta parte de un salario mensual (con auxilio incluido)." },
      { q: "¿Los trabajadores por prestación de servicios reciben prima?", a: "No. La prima es una prestación social exclusiva de los contratos laborales. Los contratistas por prestación de servicios no la reciben — su tarifa debería contemplarlo." },
      { q: "¿La prima del salario integral?", a: "El salario integral ya incluye las prestaciones sociales dentro del factor prestacional, así que no se paga prima aparte." },
    ],
    html: `
<p>La prima de servicios es un <strong>salario mensual extra al año</strong>, pagado en dos partes: la primera <strong>a más tardar el 30 de junio</strong> y la segunda <strong>en los primeros 20 días de diciembre</strong>. Todo empleado con contrato laboral tiene derecho, sin importar si es a término fijo, indefinido o por obra.</p>
<h2>La fórmula</h2>
<p><strong>Prima = (salario mensual promedio + auxilio de transporte) × días trabajados del semestre ÷ 360</strong></p>
<p>Con el salario mínimo 2026: base $2.000.000 ($1.750.905 + $249.095 de auxilio). Semestre completo (180 días):</p>
<table><thead><tr><th>Días trabajados</th><th>Prima</th></tr></thead><tbody>
<tr><td>180 (semestre completo)</td><td>$1.000.000</td></tr>
<tr><td>90 (tres meses)</td><td>$500.000</td></tr>
<tr><td>30 (un mes)</td><td>$166.667</td></tr>
</tbody></table>
<p>Si tu salario es variable (comisiones, horas extra), la base es el <strong>promedio</strong> de lo devengado en el semestre.</p>
<h2>Para que la prima no se esfume</h2>
<ol>
<li><strong>Asígnale destino antes de recibirla:</strong> deudas caras primero, fondo de emergencia después, y un porcentaje para disfrutar sin culpa.</li>
<li><strong>Regla 50/30/20 de prima:</strong> 50% a deudas o ahorro, 30% a gastos de temporada, 20% libre.</li>
<li>Regístrala como ingreso extraordinario en tu presupuesto: si entra a la cuenta del diario, se gasta sola.</li>
</ol>`,
  },
  {
    slug: "cesantias-que-son-y-cuando-se-pagan",
    title: "¿Qué son las cesantías y cuándo se pagan?",
    description:
      "Las cesantías son un salario por año trabajado que tu empleador consigna antes del 14 de febrero. Cuándo puedes retirarlas y qué intereses te deben.",
    keywords: ["cesantías", "cuándo consignan cesantías", "intereses de cesantías", "retirar cesantías"],
    date: "2026-07-18",
    category: "Ingresos",
    minutes: 3,
    faqs: [
      { q: "¿Cuándo me pagan los intereses de las cesantías?", a: "El empleador te paga directamente el 12% anual sobre el saldo de cesantías, a más tardar el 31 de enero. A diferencia de las cesantías, los intereses llegan a tu bolsillo, no al fondo." },
      { q: "¿Puedo retirar las cesantías cuando quiera?", a: "No. Solo al terminar el contrato, o en vigencia de este para: compra o mejora de vivienda, pago de educación superior (tuya, de tu cónyuge o hijos), o pago de impuesto predial de tu vivienda." },
      { q: "¿Qué fondo de cesantías elegir?", a: "Compara rentabilidad histórica y comisiones entre los fondos disponibles. Puedes trasladarte de fondo cuando quieras; el traslado es gratuito." },
    ],
    html: `
<p>Las cesantías son un <strong>ahorro obligatorio equivalente a un salario mensual por cada año trabajado</strong> (proporcional si trabajaste menos). Su propósito original: ser tu colchón si te quedas sin empleo.</p>
<h2>Fechas que debes conocer</h2>
<ul>
<li><strong>31 de enero:</strong> fecha límite para que tu empleador te pague los <strong>intereses de cesantías</strong> (12% anual sobre el saldo), directo a tu cuenta.</li>
<li><strong>14 de febrero:</strong> fecha límite para consignar las cesantías del año anterior en tu fondo (Porvenir, Protección, Colfondos o el Fondo Nacional del Ahorro).</li>
<li>Si el empleador no consigna a tiempo, debe pagarte un día de salario por cada día de retraso.</li>
</ul>
<h2>Ejemplo con salario mínimo 2026</h2>
<p>Un año completo trabajado con salario mínimo genera cesantías por <strong>$2.000.000</strong> (salario + auxilio de transporte) más <strong>$240.000</strong> de intereses pagados directamente a ti.</p>
<h2>¿Retirarlas o dejarlas?</h2>
<p>Aunque se pueden retirar para vivienda o educación, piénsalo dos veces: las cesantías son el único fondo de desempleo que tienes. Si las usas para remodelar, tu colchón queda en cero. La jugada inteligente: tener fondo de emergencia propio y dejar las cesantías como respaldo de última instancia — o usarlas solo para pagar deuda de vivienda cara.</p>`,
  },
  {
    slug: "que-es-educacion-financiera-y-por-donde-empezar",
    title: "¿Qué es la educación financiera y por dónde empezar?",
    description:
      "Educación financiera es saber ganar, gastar, ahorrar, endeudarte e invertir con criterio. Los 5 pilares y un plan de 30 días para empezar hoy.",
    keywords: ["educación financiera", "finanzas personales", "cómo aprender finanzas", "salud financiera"],
    date: "2026-07-18",
    category: "Educación financiera",
    minutes: 4,
    faqs: [
      { q: "¿Necesito saber de matemáticas o economía?", a: "No. La educación financiera del día a día usa sumas, restas y porcentajes. Lo difícil no son los números sino los hábitos: registrar, esperar antes de comprar, pagar a tiempo." },
      { q: "¿Por dónde empiezo si estoy en ceros?", a: "Por saber cuánto ganas y en qué lo gastas. Un mes registrando cada gasto te enseña más que cualquier curso. Después: presupuesto, fondo de emergencia y atacar deudas caras, en ese orden." },
      { q: "¿La educación financiera es solo para gente con plata?", a: "Al revés: cuanto más apretado el ingreso, más rinde cada decisión bien tomada. Evitar un solo crédito malo o un gota a gota vale más que cualquier tip de inversión." },
    ],
    html: `
<p>Educación financiera no es volverse experto en bolsa: es tener el <strong>criterio para decidir</strong> qué hacer con tu plata — cuánto gastar, cuándo endeudarte, dónde ahorrar y en qué invertir — sin depender de la suerte ni del "asesor" de turno.</p>
<h2>Los 5 pilares</h2>
<ol>
<li><strong>Saber a dónde va tu plata:</strong> sin registro de gastos, todo lo demás es adivinanza. Es el pilar sobre el que se construyen los otros cuatro.</li>
<li><strong>Presupuestar:</strong> decidir por adelantado, en vez de descubrir a fin de mes que no alcanzó.</li>
<li><strong>Manejar la deuda:</strong> distinguir deuda que construye (vivienda, educación, negocio) de deuda que destruye (consumo a cuotas eternas, avances, gota a gota).</li>
<li><strong>Ahorrar con propósito:</strong> fondo de emergencia primero, metas con nombre después.</li>
<li><strong>Invertir y proteger:</strong> poner la plata a trabajar por encima de la inflación y cubrir los riesgos grandes (salud, pensión).</li>
</ol>
<h2>Plan de 30 días para arrancar</h2>
<ul>
<li><strong>Semana 1:</strong> registra absolutamente todo lo que gastes. Sin juzgarte, solo anota.</li>
<li><strong>Semana 2:</strong> lista tus deudas (saldo, tasa, cuota) y tus productos financieros. Foto completa.</li>
<li><strong>Semana 3:</strong> arma tu primer presupuesto con 6-8 categorías basado en lo que descubriste.</li>
<li><strong>Semana 4:</strong> automatiza: transferencia de ahorro el día de pago y recordatorios de tus fechas de corte.</li>
</ul>
<p>En un mes pasas de "no sé en qué se me va la plata" a tener datos, plan y sistema. De ahí en adelante es mantenimiento.</p>`,
  },
  {
    slug: "como-empezar-a-invertir-en-colombia-con-poca-plata",
    title: "¿Cómo empezar a invertir en Colombia con poca plata?",
    description:
      "Puedes invertir desde $100.000: el orden correcto (emergencia → deudas → CDT → fondos → acciones), dónde hacerlo vigilado y cómo evitar pirámides.",
    keywords: ["cómo invertir en colombia", "invertir con poca plata", "inversiones para principiantes", "dónde invertir"],
    date: "2026-07-18",
    category: "Inversión",
    minutes: 5,
    faqs: [
      { q: "¿Con cuánta plata puedo empezar a invertir?", a: "Desde $100.000 o menos: hay CDTs digitales y fondos de inversión colectiva con montos mínimos bajos. El monto importa menos que la constancia: $200.000 mensuales durante años construyen un capital real." },
      { q: "¿Cómo sé si una inversión es una estafa?", a: "Tres banderas rojas: rentabilidad 'garantizada' muy superior a la de un CDT, presión por entrar ya, y que el negocio dependa de traer más gente. Verifica siempre que la entidad esté vigilada por la Superintendencia Financiera." },
      { q: "¿Invierto en dólares o en pesos?", a: "Primero domina lo básico en pesos. Tener una parte en dólares o activos internacionales diversifica, pero hazlo a través de plataformas vigiladas y entendiendo que la tasa de cambio también baja, no solo sube." },
    ],
    html: `
<p>Invertir no empieza en la bolsa: empieza por poner cada peso en el <strong>orden correcto</strong>. Saltarse los primeros pasos es la razón por la que la mayoría pierde plata "invirtiendo".</p>
<h2>El orden correcto (no te lo saltes)</h2>
<ol>
<li><strong>Fondo de emergencia:</strong> 3-6 meses de gastos en algo líquido. Sin esto, cualquier imprevisto te obliga a vender tu inversión en el peor momento.</li>
<li><strong>Matar la deuda cara:</strong> pagar una tarjeta al 25% E.A. es una "inversión" garantizada del 25%. Ningún activo legal te da eso sin riesgo.</li>
<li><strong>Renta fija:</strong> CDTs y fondos conservadores. Rentabilidad conocida, riesgo bajo, ideal para metas a 1-3 años.</li>
<li><strong>Renta variable:</strong> acciones y ETFs a través de comisionistas o plataformas vigiladas. Solo plata que no necesitas en 5+ años, aportando mensualmente sin intentar adivinar el mercado.</li>
</ol>
<h2>Dónde invertir siendo principiante</h2>
<ul>
<li><strong>CDT digital:</strong> el punto de entrada más simple. Tasa fija, desde montos bajos, asegurado por Fogafín.</li>
<li><strong>Fondos de inversión colectiva (FIC):</strong> un administrador profesional invierte por ti; entras y sales con flexibilidad.</li>
<li><strong>Plataformas de acciones locales e internacionales:</strong> para renta variable con montos pequeños. Verifica que estén vigiladas por la Superfinanciera.</li>
</ul>
<h2>Las tres reglas que te salvan</h2>
<p><strong>1)</strong> Si no entiendes de dónde sale la rentabilidad, no inviertas. <strong>2)</strong> Rentabilidad alta "garantizada" = estafa (las pirámides quiebran a los colombianos cada año). <strong>3)</strong> Diversifica: nunca todo en un solo activo, entidad o moneda.</p>`,
  },
  {
    slug: "por-que-llevar-un-control-de-gastos-te-cambia-la-vida",
    title: "¿Por qué llevar un control de gastos te cambia la vida?",
    description:
      "Registrar tus gastos reduce el gasto impulsivo, revela fugas de $200.000+ al mes, baja el estrés y convierte tus metas en fechas. Así funciona.",
    keywords: ["control de gastos", "registrar gastos", "app control de gastos", "por qué hacer presupuesto"],
    date: "2026-07-18",
    category: "Educación financiera",
    minutes: 4,
    faqs: [
      { q: "¿No es muy tedioso anotar todo?", a: "Con papel o Excel, sí — por eso se abandona. Con una app toma segundos por gasto, y el hábito se forma en dos semanas. El truco es registrar en el momento, no 'después'." },
      { q: "¿Qué hago con los datos después de un mes?", a: "Compara contra tu ingreso: ¿qué categoría te sorprendió? Ponle techo a las 2-3 más infladas y define un destino para lo que liberes (deuda o ahorro). Los datos sin decisión no sirven." },
      { q: "¿Sirve si mi pareja y yo manejamos plata juntos?", a: "Especialmente ahí: la mayoría de peleas de plata en pareja nacen de información incompleta. Un registro compartido convierte el 'tú en qué gastaste' en una conversación con datos." },
    ],
    html: `
<p>Nadie se vuelve rico por anotar gastos. Pero <strong>nadie ordena sus finanzas sin hacerlo</strong>. El registro es el punto de partida porque cambia tres cosas: lo que sabes, lo que gastas y lo que sientes.</p>
<h2>1. Aparece la plata perdida</h2>
<p>El que no registra, subestima. Domicilios, mecato, recargas, suscripciones olvidadas, "una cervecita": las fugas típicas suman <strong>$200.000 a $400.000 mensuales</strong> que se van sin decisión consciente. Verlas en una lista es lo que permite recuperarlas — eso es un CDT entero al año.</p>
<h2>2. El efecto observador: gastas menos sin proponértelo</h2>
<p>Saber que vas a anotar el gasto te hace pensarlo dos veces antes de hacerlo. Es el mismo principio de anotar lo que comes en una dieta: la medición modifica el comportamiento. La compra impulsiva pierde su mejor aliado, que es el olvido.</p>
<h2>3. El estrés baja</h2>
<p>La ansiedad financiera no viene solo de tener poco: viene de <strong>no saber</strong>. ¿Me alcanza? ¿En qué se me fue? ¿Podré pagar el arriendo? Con registro y presupuesto, esas preguntas tienen respuesta en 10 segundos. La incertidumbre es opcional.</p>
<h2>4. Las metas dejan de ser sueños</h2>
<p>"Quiero viajar" es un deseo. "Libero $150.000 al mes de domicilios y en 10 meses tengo $1.500.000 para el viaje" es un plan con fecha. Solo puedes hacer esa cuenta si conoces tus números.</p>
<p>Empieza hoy: registra todo por 30 días, sin cambiar nada más. La primera revisión te va a sorprender — y a partir de ahí, las decisiones se toman solas.</p>`,
  },
  {
    slug: "que-es-la-inflacion-y-como-afecta-tu-plata",
    title: "¿Qué es la inflación y cómo afecta tu plata?",
    description:
      "La inflación es el aumento general de precios: la misma plata compra menos. Cómo se mide en Colombia, por qué el efectivo pierde y cómo protegerte.",
    keywords: ["qué es la inflación", "inflación colombia", "ipc colombia", "cómo protegerse de la inflación"],
    date: "2026-07-18",
    category: "Educación financiera",
    minutes: 4,
    faqs: [
      { q: "¿Quién mide la inflación en Colombia?", a: "El DANE, a través del Índice de Precios al Consumidor (IPC): una canasta de bienes y servicios cuyo precio se compara mes a mes. El Banco de la República ajusta sus tasas de interés para mantenerla cerca de su meta del 3%." },
      { q: "¿Por qué subieron tanto los precios en 2022-2023?", a: "Colombia llegó a superar el 13% anual por los choques globales de la pandemia, los fletes y el dólar caro. Desde entonces la inflación ha ido cediendo, pero los precios no bajan: solo suben más despacio." },
      { q: "¿La inflación afecta mis deudas?", a: "A tu favor, si son de tasa fija: pagas con pesos que valen menos. En contra, si la deuda está atada a UVR o tasa variable, porque la cuota sube con la inflación o las tasas." },
    ],
    html: `
<p>La inflación es el aumento sostenido de los precios: con los mismos $50.000 del mercado, cada año llevas menos cosas. No es que la plata "desaparezca" — es que <strong>pierde poder de compra</strong> en silencio.</p>
<h2>El ejemplo que lo explica todo</h2>
<p>Con inflación del 5% anual, algo que hoy cuesta $100.000 costará $105.000 el otro año. Suena poco, pero se acumula: en 10 años a ese ritmo, necesitas <strong>$163.000</strong> para comprar lo mismo. Tu plata quieta debajo del colchón perdió un tercio de su valor sin que la tocaras.</p>
<h2>El error silencioso: ahorrar en efectivo</h2>
<p>Guardar en la alcancía o en una cuenta que paga 0% es <em>perder</em> exactamente la inflación cada año. Por eso la regla de oro del ahorro es la <strong>tasa real</strong>:</p>
<p><strong>Tasa real = lo que te paga la inversión − la inflación.</strong></p>
<p>Un CDT al 9% con inflación del 5% te deja un 4% real: ganaste. Una cuenta al 0,1% con esa misma inflación te deja −4,9%: perdiste, aunque el saldo "no bajó".</p>
<h2>Cómo defenderte</h2>
<ul>
<li><strong>Efectivo, el mínimo necesario:</strong> solo lo del día a día y el fondo de emergencia en cuenta remunerada.</li>
<li><strong>Exige tasa real positiva:</strong> compara cualquier inversión contra la inflación vigente, no contra cero.</li>
<li><strong>Ajusta tus números cada año:</strong> presupuesto, tarifas si eres independiente y metas de ahorro deben subir al menos lo que subió el IPC — si no, te estás recortando solo.</li>
</ul>`,
  },
  {
    slug: "como-invertir-en-un-cdt-paso-a-paso",
    title: "¿Cómo invertir en un CDT paso a paso?",
    description:
      "Guía práctica para abrir tu primer CDT: cuánto invertir, cómo comparar tasas E.A., abrirlo 100% digital y qué hacer al vencimiento. Con ejemplos.",
    keywords: ["cómo invertir en cdt", "abrir un cdt", "cdt paso a paso", "cdt digital colombia"],
    date: "2026-07-18",
    category: "Inversión",
    minutes: 4,
    faqs: [
      { q: "¿Qué pasa cuando el CDT vence?", a: "Decides: retirar plata e intereses, o renovarlo. Ojo con la renovación automática: puede reengancharte a una tasa peor que la del mercado. Pon un recordatorio unos días antes del vencimiento." },
      { q: "¿Es mejor un CDT de 90 o de 360 días?", a: "Depende de cuándo necesitas la plata y de hacia dónde van las tasas. Si no lo tienes claro, escalona: divide en 2-3 CDTs de plazos distintos y ganas flexibilidad sin sacrificar toda la tasa." },
      { q: "¿El CDT digital es seguro?", a: "Sí, siempre que la entidad esté vigilada por la Superfinanciera: aplica el mismo seguro de Fogafín (hasta $50 millones por entidad) que en un banco tradicional. Verifica el listado oficial antes de abrir." },
    ],
    html: `
<p>Abrir un CDT hoy toma <strong>menos de 15 minutos desde el celular</strong>. Lo que separa una buena inversión de una mediocre no es el trámite: es comparar bien antes de firmar.</p>
<h2>Paso 1: define monto y plazo</h2>
<p>Solo plata que <em>no</em> vas a necesitar durante el plazo — el CDT no se puede tocar antes del vencimiento. Tu fondo de emergencia no va aquí (o solo la porción de los meses 3-6, escalonada).</p>
<h2>Paso 2: compara la tasa E.A., no la publicidad</h2>
<ul>
<li>Pide siempre la <strong>tasa efectiva anual</strong> para el monto y plazo exactos: es el único número comparable entre entidades.</li>
<li>Bancos digitales y compañías de financiamiento suelen pagar 1-3 puntos más que los bancos grandes.</li>
<li>Verifica que la entidad aparezca como vigilada en superfinanciera.gov.co — con eso, tu depósito queda amparado por Fogafín hasta $50.000.000.</li>
</ul>
<h2>Paso 3: ábrelo digital</h2>
<p>Cédula, datos básicos, transferencia desde tu cuenta — la mayoría de entidades lo hacen 100% en línea. Guarda el certificado: ahí está la tasa pactada, el plazo y la fecha de vencimiento.</p>
<h2>¿Cuánto recibirías? (ejemplo al 9% E.A., 12 meses)</h2>
<table><thead><tr><th>Inviertes</th><th>Intereses (antes de retención)</th></tr></thead><tbody>
<tr><td>$1.000.000</td><td>$90.000</td></tr>
<tr><td>$5.000.000</td><td>$450.000</td></tr>
<tr><td>$10.000.000</td><td>$900.000</td></tr>
</tbody></table>
<p>La tasa exacta depende de la entidad y el momento — usa la tabla como orden de magnitud, no como promesa.</p>
<h2>Paso 4: al vencimiento, decide tú</h2>
<p>Desactiva la renovación automática o revísala: renovar a ciegas suele significar peor tasa. Compara de nuevo el mercado — cambiar de entidad al vencimiento no cuesta nada.</p>`,
  },
  {
    slug: "que-es-el-interes-compuesto-y-como-usarlo-a-tu-favor",
    title: "¿Qué es el interés compuesto y cómo usarlo a tu favor?",
    description:
      "El interés compuesto hace que tus rendimientos generen rendimientos: $200.000 al mes pueden volverse cientos de millones. También aplica en contra: tus deudas.",
    keywords: ["interés compuesto", "cómo funciona el interés compuesto", "invertir a largo plazo", "crecimiento del ahorro"],
    date: "2026-07-18",
    category: "Educación financiera",
    minutes: 4,
    faqs: [
      { q: "¿Por qué se dice que el tiempo importa más que el monto?", a: "Porque el crecimiento se acelera al final: cada año de rendimientos se suma a la base del siguiente. Empezar a los 25 con poco le gana casi siempre a empezar a los 40 con mucho. El mejor momento para empezar fue ayer; el segundo mejor es hoy." },
      { q: "¿Dónde consigo interés compuesto en Colombia?", a: "Reinvirtiendo: CDTs que renuevas con intereses incluidos, fondos de inversión donde los rendimientos se capitalizan, aportes constantes a portafolios de largo plazo. La clave es no retirar las ganancias." },
      { q: "¿El interés compuesto puede jugar en mi contra?", a: "Sí, y con fuerza: es exactamente como crece una tarjeta de crédito pagando solo el mínimo o un gota a gota. Los intereses generan intereses también cuando los debes tú." },
    ],
    html: `
<p>El interés compuesto es rendimiento sobre rendimiento: los intereses que ganas se suman al capital y <strong>también empiezan a producir</strong>. Al principio se siente lento; con los años, la curva se dispara. Einstein no lo llamó la octava maravilla del mundo (la frase es apócrifa), pero el efecto sí es de maravilla.</p>
<h2>Los números que lo demuestran</h2>
<p>Aportando <strong>$200.000 mensuales</strong> con una rentabilidad promedio del 10% E.A. reinvertida:</p>
<table><thead><tr><th>Años aportando</th><th>Tú pusiste</th><th>Tendrías aprox.</th></tr></thead><tbody>
<tr><td>10 años</td><td>$24.000.000</td><td>$40.000.000</td></tr>
<tr><td>20 años</td><td>$48.000.000</td><td>$143.000.000</td></tr>
<tr><td>30 años</td><td>$72.000.000</td><td>$412.000.000</td></tr>
</tbody></table>
<p>Fíjate en el patrón: en la década final el capital crece más que en las dos primeras juntas. Por eso <strong>empezar temprano vale más que aportar mucho</strong> — y por eso interrumpir el proceso a mitad de camino sale tan caro.</p>
<h2>Las tres palancas (en orden de poder)</h2>
<ol>
<li><strong>Tiempo:</strong> la palanca que no se puede comprar después. Cada año que esperas es el más caro de todos.</li>
<li><strong>Constancia:</strong> el aporte mensual automático, en meses buenos y malos.</li>
<li><strong>Tasa:</strong> importa, pero menos que las otras dos. No persigas rentabilidades milagrosas: persigue décadas.</li>
</ol>
<h2>El lado oscuro</h2>
<p>La misma matemática trabaja para el banco cuando pagas el mínimo de la tarjeta: al 25% E.A., una deuda de $1.000.000 que no abonas se duplica en unos 3 años. El interés compuesto no es bueno ni malo — la pregunta es si está a tu favor o en tu contra.</p>`,
  },
  {
    slug: "como-usar-la-tarjeta-de-credito-sin-endeudarte",
    title: "¿Cómo usar la tarjeta de crédito sin endeudarte?",
    description:
      "La tarjeta bien usada construye historial gratis; mal usada cobra 25% anual. Las reglas: una cuota, pago total, cero avances y fechas de corte claras.",
    keywords: ["cómo usar tarjeta de crédito", "tarjeta de crédito colombia", "pagar el mínimo tarjeta", "cuota de manejo"],
    date: "2026-07-18",
    category: "Crédito",
    minutes: 4,
    faqs: [
      { q: "¿Qué pasa si pago solo el mínimo?", a: "El saldo restante sigue generando intereses (~25% E.A.) y la deuda se estira por años. El mínimo existe para no caer en mora, no como plan de pago. Si solo puedes pagar el mínimo, es señal de frenar el uso de la tarjeta ya." },
      { q: "¿A cuántas cuotas difiero mis compras?", a: "Lo cotidiano (mercado, gasolina, comida) a 1 cuota: no genera intereses en la mayoría de tarjetas. Diferir lo consumible a 24 o 36 cuotas es pagar intereses por cosas que ya no existen." },
      { q: "¿Cómo evito la cuota de manejo?", a: "Varias entidades ofrecen tarjetas sin cuota de manejo de por vida, y otras la exoneran por monto de uso mensual. Si tu banco te cobra, negocia o cámbiate: es de los cobros más fáciles de eliminar." },
    ],
    html: `
<p>La tarjeta de crédito es una herramienta neutra: bien usada te da historial crediticio, seguros y hasta 45 días de plazo <strong>gratis</strong>; mal usada es deuda al ~25% E.A. La diferencia está en cuatro reglas.</p>
<h2>Regla 1: compra solo lo que ya puedes pagar</h2>
<p>La tarjeta difiere el pago, no lo hace más barato. Si no tienes la plata hoy ni la tendrás en la fecha límite de pago, no es una compra: es una deuda disfrazada.</p>
<h2>Regla 2: todo a una cuota, pago total</h2>
<ul>
<li>A <strong>1 cuota</strong>, la mayoría de tarjetas no cobra intereses: usaste plata del banco gratis por semanas.</li>
<li>Paga siempre el <strong>total facturado</strong>, no el mínimo. El mínimo es la puerta de entrada al interés compuesto en tu contra.</li>
<li>Cuotas largas solo para bienes durables (un computador para trabajar, una nevera) y sabiendo la tasa.</li>
</ul>
<h2>Regla 3: jamás avances en efectivo</h2>
<p>El avance cobra interés <strong>desde el día uno</strong> (sin periodo de gracia), a la tasa máxima, más comisión. Es de las formas más caras de conseguir efectivo legal en Colombia. Si necesitas efectivo recurrente, el problema es de presupuesto, no de liquidez.</p>
<h2>Regla 4: domina tus fechas</h2>
<p><strong>Fecha de corte</strong>: cierra el ciclo y define qué entra en el extracto. <strong>Fecha límite de pago</strong>: hasta cuándo pagar sin mora. Comprar justo después del corte te da el plazo máximo sin intereses. Anota ambas fechas donde las veas — la mora por olvido es la más tonta de todas y castiga tu puntaje igual que la mora real.</p>
<p>Registrar cada compra de tarjeta el mismo día que la haces evita el clásico "¿yo en qué me gasté todo este extracto?".</p>`,
  },
  {
    slug: "errores-financieros-mas-comunes-y-como-evitarlos",
    title: "Los 8 errores financieros más comunes (y cómo evitarlos)",
    description:
      "De pagar solo el mínimo a mezclar la plata del negocio con la personal: los errores que más plata les cuestan a los colombianos y su solución práctica.",
    keywords: ["errores financieros", "malos hábitos financieros", "finanzas personales errores", "cómo manejar el dinero"],
    date: "2026-07-18",
    category: "Educación financiera",
    minutes: 5,
    faqs: [
      { q: "¿Cuál es el error más costoso de todos?", a: "En monto, las pirámides y el gota a gota. En frecuencia, vivir sin registro ni presupuesto: es el error silencioso que causa casi todos los demás, porque sin datos cada decisión se toma a ciegas." },
      { q: "¿Ser codeudor es tan grave como dicen?", a: "Sí: la deuda es tuya ante el banco, aparece en tu historial, reduce tu capacidad de endeudamiento y si el titular falla, te cobran a ti. Solo sé codeudor de una deuda que podrías pagar sin arruinarte." },
      { q: "¿Y si ya cometí varios de estos errores?", a: "Bienvenido al club: todos los cometimos. El orden de salida es siempre el mismo: registrar, presupuestar, fondo de emergencia pequeño, matar deuda cara, y de ahí construir. Seis meses de método reparan años de desorden." },
    ],
    html: `
<p>Estos son los errores que más plata les cuestan a los colombianos — no por ignorancia, sino porque nadie nos los advirtió a tiempo:</p>
<h2>1. Vivir sin saber en qué se va la plata</h2>
<p>El error raíz. Sin registro no hay presupuesto, sin presupuesto no hay ahorro, y el fin de mes siempre llega con sorpresa. <strong>Solución:</strong> registra todo por 30 días.</p>
<h2>2. Pagar solo el mínimo de la tarjeta</h2>
<p>Al ~25% E.A., el mínimo perpetúa la deuda por años. <strong>Solución:</strong> paga el total; si no puedes, congela la tarjeta y ataca el saldo con método bola de nieve.</p>
<h2>3. No tener fondo de emergencia</h2>
<p>Sin colchón, cualquier imprevisto se paga con deuda cara. <strong>Solución:</strong> $500.000 iniciales, luego 3-6 meses de gastos.</p>
<h2>4. Caer en gota a gota o pirámides</h2>
<p>Tasas del 400%+ o "rentabilidades garantizadas" que quiebran familias enteras. <strong>Solución:</strong> cooperativas y entidades vigiladas para crédito; desconfía de toda ganancia fácil.</p>
<h2>5. Prestar plata (o firmar como codeudor) sin poder perderla</h2>
<p>Presta solo lo que puedas regalar sin resentimiento, y sé codeudor solo de lo que podrías pagar tú.</p>
<h2>6. Endeudarse por estatus</h2>
<p>El celular de gama alta a 36 cuotas y el carro que se come medio sueldo son pobreza con buena presentación. <strong>Solución:</strong> que las cuotas totales no pasen del 30% de tu ingreso.</p>
<h2>7. No cotizar pensión siendo independiente</h2>
<p>Cada año sin aportar son semanas que no se recuperan. <strong>Solución:</strong> aporta aunque sea sobre el mínimo — tu yo de 65 años te lo agradecerá.</p>
<h2>8. Mezclar la plata del negocio con la personal</h2>
<p>El clásico de tenderos y emprendedores: la caja del negocio paga el mercado de la casa y nadie sabe si el negocio de verdad da utilidad. <strong>Solución:</strong> cuentas separadas y registro aparte — en Finance puedes llevar el perfil personal y el del negocio separados en la misma app.</p>`,
  },
  {
    slug: "nequi-vs-daviplata-cual-elegir",
    title: "¿Nequi o Daviplata? Cuál elegir según tu uso",
    description:
      "Comparamos Nequi y Daviplata: apertura, funciones, bolsillos, Bre-B y para quién es mejor cada una. La respuesta corta: depende de tu ecosistema.",
    keywords: ["nequi vs daviplata", "cuál es mejor nequi o daviplata", "billeteras digitales colombia", "comparación nequi daviplata"],
    date: "2026-07-19",
    category: "Bancos digitales",
    minutes: 4,
    faqs: [
      { q: "¿Puedo tener Nequi y Daviplata al mismo tiempo?", a: "Sí, y es lo que hace la mayoría: no compiten entre sí para el usuario. Muchos usan una para el día a día y otra para recibir pagos o separar la plata del negocio." },
      { q: "¿La plata en estas billeteras está protegida?", a: "Ambas operan como depósitos en entidades vigiladas por la Superfinanciera y cuentan con la protección del sistema financiero. No son 'apps sueltas': detrás están Bancolombia y Davivienda." },
      { q: "¿Cuál rinde más?", a: "Ninguna de las dos es un producto de inversión: para poner la plata a rentar usa sus opciones de bolsillos remunerados si están disponibles, o un CDT digital. La billetera es para mover plata, no para guardarla a largo plazo." },
    ],
    html: `
<p>Las dos billeteras más usadas de Colombia hacen lo mismo en esencia — guardar, enviar y recibir plata desde el celular, gratis y sin papeleo. La diferencia está en el <strong>ecosistema</strong> al que pertenecen y en detalles de uso diario.</p>
<h2>Lo que comparten</h2>
<ul>
<li>Apertura en minutos solo con cédula y celular, sin cuota de manejo.</li>
<li>Transferencias inmediatas con <strong>Bre-B</strong> hacia cualquier banco o billetera.</li>
<li>Recargas, retiros en corresponsales y cajeros, pagos de servicios y compras.</li>
<li>Pueden marcarse como cuenta exenta del 4x1000.</li>
</ul>
<h2>Dónde se diferencian</h2>
<p><strong>Nequi</strong> (Bancolombia) brilla en organización: bolsillos para separar metas, apartados automáticos y una integración natural si tú o tus clientes ya se mueven en el mundo Bancolombia — que en Colombia es media población.</p>
<p><strong>Daviplata</strong> (Davivienda) es fuerte en cobertura y simpleza: fue la billetera de los subsidios estatales, la conoce todo el mundo y funciona muy bien como canal de cobro en negocios de barrio donde "¿tienes Daviplata?" es pregunta estándar.</p>
<h2>Cuál elegir</h2>
<ul>
<li><strong>Para tu día a día:</strong> la del ecosistema donde ya está tu nómina o tu banco principal — menos fricción y menos comisiones cruzadas.</li>
<li><strong>Para tu negocio:</strong> la que usen más tus clientes. En la práctica: ambas, y con Bre-B la diferencia cada vez importa menos.</li>
<li><strong>Para ahorrar:</strong> ninguna como destino final — usa la billetera para mover, y un CDT o cuenta remunerada para guardar.</li>
</ul>
<p>El error real no es elegir mal la billetera: es dejar la plata regada entre varias sin saber cuánto hay en total. Sea cual sea tu combinación, consolida el panorama en un solo lugar.</p>`,
  },
  {
    slug: "cdt-vs-cuenta-de-ahorros-donde-poner-la-plata",
    title: "¿CDT o cuenta de ahorros? Dónde poner tu plata",
    description:
      "CDT: más tasa, plata inmovilizada. Cuenta remunerada: menos tasa, disponible ya. Cuándo usar cada uno y la estrategia mixta que aprovecha ambos.",
    keywords: ["cdt o cuenta de ahorros", "dónde poner la plata", "cuenta remunerada vs cdt", "dónde ahorrar colombia"],
    date: "2026-07-19",
    category: "Inversión",
    minutes: 4,
    faqs: [
      { q: "¿Y si necesito la plata antes del vencimiento del CDT?", a: "Ese es exactamente el riesgo del CDT: no puedes retirarla (o pagas penalidad). Por eso el fondo de emergencia va en cuenta remunerada o fondo de inversión líquido, y al CDT solo va plata con fecha conocida." },
      { q: "¿Qué es mejor para el fondo de emergencia?", a: "Cuenta de ahorros remunerada o fondo de inversión conservador: disponibilidad en horas. Como mucho, la porción de los meses 3-6 del fondo puede ir en CDTs cortos escalonados." },
      { q: "¿Las cuentas de ahorro tradicionales no sirven?", a: "Una cuenta que paga 0,1% con inflación del 5% pierde plata en términos reales. Si tu banco no te remunera el saldo, muévelo: hay cuentas digitales que pagan varios puntos sin sacrificar disponibilidad." },
    ],
    html: `
<p>La pregunta correcta no es cuál es mejor, sino <strong>para qué plata</strong>. Cada instrumento gana en su terreno:</p>
<h2>Cara a cara</h2>
<table><thead><tr><th>Criterio</th><th>CDT</th><th>Cuenta remunerada</th></tr></thead><tbody>
<tr><td>Tasa</td><td>Mayor (pactada fija)</td><td>Menor (variable)</td></tr>
<tr><td>Disponibilidad</td><td>Al vencimiento</td><td>Inmediata</td></tr>
<tr><td>Riesgo de tasa</td><td>Cero: queda pactada</td><td>Puede bajar mañana</td></tr>
<tr><td>Ideal para</td><td>Metas con fecha</td><td>Fondo de emergencia</td></tr>
<tr><td>Protección</td><td colspan="2">Ambos: Fogafín hasta $50 millones por entidad</td></tr>
</tbody></table>
<h2>La decisión en una regla</h2>
<p><strong>¿Sabes cuándo necesitarás la plata?</strong> Si la fecha es conocida (prima de diciembre, matrícula de enero, viaje de junio), el CDT te da más tasa sin riesgo real, porque no la tocarás antes. Si la fecha es "no sé, cuando pase algo" — emergencias — la liquidez vale más que los puntos extra de tasa.</p>
<h2>La estrategia mixta (lo que hacen los que saben)</h2>
<ol>
<li><strong>Cuenta remunerada:</strong> fondo de emergencia y flujo del mes.</li>
<li><strong>CDTs escalonados:</strong> el ahorro de mediano plazo dividido en varios CDT con vencimientos cada 90 días — tasa de CDT con liquidez trimestral.</li>
<li><strong>Renovación consciente:</strong> al vencer cada CDT, compara el mercado antes de renovar; la renovación automática suele pagar menos.</li>
</ol>
<p>Lo único imperdonable es la plata grande quieta en una cuenta al 0%: ahí la inflación te cobra un "impuesto" silencioso todos los meses.</p>`,
  },
  {
    slug: "colpensiones-vs-fondo-privado-donde-cotizar",
    title: "¿Colpensiones o fondo privado? Dónde cotizar pensión",
    description:
      "Prima media vs ahorro individual: cómo calcula la pensión cada régimen, para quién conviene cada uno y qué considerar antes de un traslado.",
    keywords: ["colpensiones o fondo privado", "dónde cotizar pensión", "régimen de prima media", "traslado de fondo de pensiones"],
    date: "2026-07-19",
    category: "Pensión",
    minutes: 5,
    faqs: [
      { q: "¿Puedo cambiarme de régimen cuando quiera?", a: "Los traslados tienen reglas y plazos (históricamente, hasta 10 años antes de la edad de pensión). Antes de decidir, pide la doble asesoría obligatoria: ambas entidades deben mostrarte proyecciones de tu pensión en cada régimen." },
      { q: "¿Qué pasó con la reforma pensional?", a: "La reforma aprobada en 2024 plantea un sistema de pilares donde los aportes hasta cierto nivel van al componente público. Su implementación ha estado sujeta a decisiones judiciales, así que verifica el estado vigente en Colpensiones o tu fondo antes de tomar decisiones de traslado." },
      { q: "¿Si soy independiente también debo cotizar?", a: "Sí, sobre al menos el 40% de tus ingresos mensualizados (mínimo sobre un salario mínimo). Cada año sin cotizar son semanas que después no se recuperan — y las semanas son el requisito más difícil de completar." },
    ],
    html: `
<p>En Colombia han coexistido dos formas de construir pensión, y la diferencia de resultado entre una y otra puede ser <strong>enorme</strong> según tu perfil:</p>
<h2>Cómo funciona cada uno</h2>
<ul>
<li><strong>Colpensiones (prima media):</strong> tus aportes van a una bolsa común. La pensión se calcula sobre el <em>promedio salarial de tus últimos 10 años</em> y las semanas cotizadas — no sobre cuánto acumulaste. Con los requisitos completos, la mesada es predecible y de por vida.</li>
<li><strong>Fondo privado (ahorro individual):</strong> tus aportes van a <em>tu cuenta</em>, se invierten y generan rendimientos. Tu pensión depende del capital que logres acumular. Permite pensionarse antes si el capital alcanza, y el saldo es heredable.</li>
</ul>
<h2>Para quién suele ganar cada uno</h2>
<table><thead><tr><th>Perfil</th><th>Suele convenir</th></tr></thead><tbody>
<tr><td>Salarios altos al final de la carrera</td><td>Colpensiones (promedia solo los últimos años)</td></tr>
<tr><td>Ingresos variables o carrera corta</td><td>Fondo privado (todo aporte suma capital)</td></tr>
<tr><td>Quien valora herencia del ahorro</td><td>Fondo privado</td></tr>
<tr><td>Quien valora mesada garantizada</td><td>Colpensiones</td></tr>
</tbody></table>
<h2>Antes de decidir (o trasladarte)</h2>
<ol>
<li>Pide la <strong>doble asesoría</strong>: es obligatoria y gratuita — ambas entidades deben proyectarte tu pensión en cada régimen con tus números reales.</li>
<li>Revisa tu <strong>historia laboral</strong> en ambos sistemas: semanas mal registradas son plata perdida y se corrigen con reclamo.</li>
<li>Ten presente que la <strong>reforma pensional</strong> aprobada en 2024 plantea un sistema de pilares; su implementación ha estado en manos de los tribunales — confirma las reglas vigentes antes de firmar un traslado.</li>
</ol>
<p>Y la regla que aplica en ambos regímenes: el peor escenario no es elegir "mal" — es dejar de cotizar. Las semanas no se improvisan a los 60.</p>`,
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

// Autor visible en cada post (E-E-A-T): cámbialo aquí una sola vez.
export const AUTHOR = {
  name: "Brayan Gómez",
  role: "Fundador de Finance",
};

// Pasos para schema HowTo en los posts tipo guía (rich results).
export const howtos: Record<string, { name: string; steps: string[] }> = {
  "como-invertir-en-un-cdt-paso-a-paso": {
    name: "Cómo invertir en un CDT",
    steps: [
      "Define el monto y el plazo: solo plata que no necesitarás durante ese tiempo.",
      "Compara la tasa efectiva anual (E.A.) entre entidades vigiladas por la Superfinanciera.",
      "Abre el CDT en línea con tu cédula y transfiere el monto desde tu cuenta.",
      "Al vencimiento, compara de nuevo el mercado antes de renovar.",
    ],
  },
  "como-hacer-un-presupuesto-personal": {
    name: "Cómo hacer un presupuesto personal",
    steps: [
      "Calcula tu ingreso real: lo que efectivamente llega a tu bolsillo.",
      "Lista los gastos fijos y réstalos del ingreso.",
      "Ponle un techo mensual a cada categoría de gasto variable.",
      "Registra cada gasto en el momento y revisa el presupuesto una vez por semana.",
    ],
  },
};

// Fuentes oficiales citadas al pie de los posts con cifras (E-E-A-T).
export const sources: Record<string, { name: string; url: string }[]> = {
  "cuanto-es-el-salario-minimo-2026-en-colombia": [
    { name: "Presidencia de Colombia — Decretos 1469 y 1470 de 2025", url: "https://www.presidencia.gov.co/prensa/Paginas/Salario-vital-2-000-000-a-partir-de-enero-de-2026-251230.aspx" },
    { name: "Ley 2101 de 2021 — reducción de jornada laboral", url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=167014" },
  ],
  "quienes-deben-declarar-renta-en-2026": [
    { name: "DIAN — Declaración de renta personas naturales", url: "https://www.dian.gov.co" },
  ],
  "que-es-bre-b-y-como-funciona": [
    { name: "Banco de la República — Bre-B (pagos inmediatos)", url: "https://www.banrep.gov.co/es/bre-b" },
  ],
  "que-es-el-4x1000-y-como-evitarlo": [
    { name: "DIAN — Gravamen a los Movimientos Financieros (GMF)", url: "https://www.dian.gov.co" },
  ],
  "que-es-la-inflacion-y-como-afecta-tu-plata": [
    { name: "DANE — Índice de Precios al Consumidor (IPC)", url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-al-consumidor-ipc" },
    { name: "Banco de la República — meta de inflación", url: "https://www.banrep.gov.co/es/estadisticas/inflacion-total-y-meta" },
  ],
  "cuando-pagan-la-prima-y-como-se-calcula": [
    { name: "Código Sustantivo del Trabajo, art. 306 — prima de servicios", url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=33104" },
  ],
  "cesantias-que-son-y-cuando-se-pagan": [
    { name: "Ley 50 de 1990 — régimen de cesantías", url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=281" },
  ],
  "que-es-un-cdt-y-cuanto-rinde": [
    { name: "Fogafín — seguro de depósitos", url: "https://www.fogafin.gov.co" },
  ],
  "como-invertir-en-un-cdt-paso-a-paso": [
    { name: "Superintendencia Financiera — entidades vigiladas", url: "https://www.superfinanciera.gov.co" },
    { name: "Fogafín — seguro de depósitos", url: "https://www.fogafin.gov.co" },
  ],
};
