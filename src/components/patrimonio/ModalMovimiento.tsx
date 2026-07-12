"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { today } from "../../data/mock";
import { CATS_IN, CATS_OUT } from "../../data/constants";
import { addFinance, updateFinance } from "../../../lib/actions";
import { enqueue } from "../../../lib/offlineQueue";
import ModalShell, { CancelSave, MoneyInput, fieldClass, labelClass } from "./ModalShell";
import { useToast } from "./Toast";
import type { BankAccount, Category, Finance, Budget, BudgetConfig } from "../../types";
import { Period, getPeriodRange } from "./periods";

type TxType = "ingreso" | "egreso";

// ---------------------------------------------------------------------------
// Spanish number parser — handles "35 mil", "un millón", "treinta y cinco mil"
// Returns { amount, wordsConsumed } from the beginning of a word array.
// Connectors ("y", "de", "pesos") are consumed as noise but not counted.
// ---------------------------------------------------------------------------
const SPAN_ONES: Record<string, number> = {
  "un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4,
  "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9,
  "diez": 10, "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
  "dieciséis": 16, "dieciseis": 16, "diecisiete": 17, "dieciocho": 18, "diecinueve": 19,
  "veinte": 20, "veintiún": 21, "veintiuno": 21, "veintidós": 22, "veintidos": 22,
  "veintitrés": 23, "veintitres": 23, "veinticuatro": 24, "veinticinco": 25,
  "veintiséis": 26, "veintiseis": 26, "veintisiete": 27, "veintiocho": 28, "veintinueve": 29,
  "treinta": 30, "cuarenta": 40, "cincuenta": 50, "sesenta": 60,
  "setenta": 70, "ochenta": 80, "noventa": 90,
  "cien": 100, "ciento": 100,
  "doscientos": 200, "doscientas": 200, "trescientos": 300, "trescientas": 300,
  "cuatrocientos": 400, "cuatrocientas": 400, "quinientos": 500, "quinientas": 500,
  "seiscientos": 600, "seiscientas": 600, "setecientos": 700, "setecientas": 700,
  "ochocientos": 800, "ochocientas": 800, "novecientos": 900, "novecientas": 900,
};
const SPAN_CONNECTORS = new Set(["y", "de", "pesos", "con"]);

function spanishAmountFromWords(words: string[]): { amount: number; wordsConsumed: number } | null {
  let total = 0, current = 0, consumed = 0, hasNum = false;
  for (let i = 0; i < words.length; i++) {
    const wl = words[i].toLowerCase();
    if (SPAN_CONNECTORS.has(wl)) { consumed = i + 1; continue; }
    if (/^(millones?|millón|millon)$/.test(wl)) {
      current = current || 1; total += current * 1_000_000; current = 0; consumed = i + 1; hasNum = true;
    } else if (wl === "mil") {
      current = current || 1; total += current * 1_000; current = 0; consumed = i + 1; hasNum = true;
    } else {
      const dm = words[i].match(/^(\d{1,3}(?:\.\d{3}){0,2}|\d{1,10})$/);
      if (dm) {
        const n = parseInt(dm[1].replace(/\./g, ""), 10);
        if (n > 0) { current += n; consumed = i + 1; hasNum = true; }
      } else if (SPAN_ONES[wl] !== undefined) {
        current += SPAN_ONES[wl]; consumed = i + 1; hasNum = true;
      } else {
        break;
      }
    }
  }
  total += current;
  if (!hasNum || total <= 0 || total >= 2_000_000_000) return null;
  return { amount: total, wordsConsumed: consumed };
}

// Tries to find an amount anywhere in the word array.
// For "number first": parse from index 0.
// For "number last": scan forward to find the start of a complete trailing number.
function parseAmountAndDesc(words: string[]): { amount: number; desc: string } | null {
  // 1. Number at start
  const fromStart = spanishAmountFromWords(words);
  if (fromStart) {
    const rest = words.slice(fromStart.wordsConsumed).filter(w => !SPAN_CONNECTORS.has(w.toLowerCase()));
    if (rest.length > 0 || fromStart.amount > 0) {
      return { amount: fromStart.amount, desc: rest.join(" ") };
    }
  }
  // 2. Number at end — scan forward until we find a trailing complete number
  for (let startIdx = 1; startIdx < words.length; startIdx++) {
    const slice = words.slice(startIdx);
    const r = spanishAmountFromWords(slice);
    if (r && r.wordsConsumed === slice.length) {
      const desc = words.slice(0, startIdx).filter(w => !SPAN_CONNECTORS.has(w.toLowerCase())).join(" ");
      return { amount: r.amount, desc };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Semantic concept → category pattern map
// keywords: words the user might say; catPatterns: substrings to look for in
// the user's actual category names (case-insensitive, user-defined names vary).
// ---------------------------------------------------------------------------
const CONCEPT_MAP: Array<{ keywords: string[]; catPatterns: string[] }> = [
  {
    // Comida y bebidas — restaurantes, mercado, delivery, tiendas locales
    keywords: [
      "almuerzo", "comida", "desayuno", "cena", "merienda", "snack", "onces",
      "restaurante", "restauran", "rest ", "fondita", "fonda", "asadero", "parrilla",
      "churrascaria", "buffet", "comida corriente", "corrientazo",
      "pizza", "hamburguesa", "pollo", "sushi", "tacos", "burrito", "ramen",
      "ajiaco", "bandeja", "sancocho", "empanada", "arepa", "changua", "mazamorra",
      "pandebono", "buñuelo", "almojábana", "tamale", "chicharrón", "mondongo",
      "cuchuco", "lechona", "morcilla", "chorizo", "fritanga", "piquete",
      "café", "tinto", "capuchino", "espresso", "aromática", "agua panela", "chocolate",
      "jugo", "gaseosa", "limonada", "cerveza de restaurante",
      "domicilio", "rappi", "ifood", "ubereats", "uber eats", "domicilios", "pedidosya",
      "mercado", "supermercado", "tienda", "minimercado", "D1", "ara", "justo y bueno",
      "éxito", "exito", "carulla", "jumbo", "makro", "olímpica", "olimpica", "surtimax",
      "cooratiendas", "la 14", "metro supermercado", "tienda de barrio",
      "panadería", "panaderia", "heladería", "heladeria", "cafetería", "cafeteria",
      "leche", "huevos", "frutas", "verduras", "pollo crudo", "carne", "pescado",
      "queso", "yogur", "cereal", "arroz", "pasta", "aceite", "sal", "azúcar",
      "mcdonald", "burger king", "kfc", "subway", "domino", "papa john", "presto", "kokoriko",
    ],
    catPatterns: ["aliment", "comida", "food", "mercado", "restaur", "cocina", "comer", "groc"],
  },
  {
    // Vivienda — arriendo, servicios públicos, mantenimiento, hogar
    keywords: [
      "arriendo", "alquiler", "canon", "hipoteca", "cuota casa", "cuota apartamento",
      "administración", "administracion", "cuota administración", "conjunto",
      "servicios públicos", "servicios publicos", "luz", "energía", "energia", "epm",
      "codensa", "celsia", "emcali", "electricidad", "agua", "acueducto", "alcantarillado",
      "gas natural", "sur gas", "gases del caribe", "gas domiciliario",
      "internet", "wifi", "fibra", "claro hogar", "tigo hogar", "etb", "movistar hogar",
      "teléfono fijo", "telefono fijo", "cable", "televisión", "television",
      "basura", "aseo urbano", "predial",
      "plomero", "electricista", "cerrajero", "pintura", "pintor", "techado", "goteras",
      "reparación", "reparacion", "mantenimiento casa", "fumigación", "fumigacion",
      "doméstica", "domestica", "empleada", "aseo casa", "limpieza casa", "escoba",
      "trapero", "detergente", "jabón loza", "brillapiso",
      "mueble", "colchón", "colchon", "sofá", "sofa", "closet", "nevera", "refrigerador",
      "estufa", "lavadora", "secadora", "microondas", "licuadora", "electrodoméstico",
      "cortinas", "persianas", "lámparas", "lamparas", "silla", "mesa",
    ],
    catPatterns: ["casa", "hogar", "vivienda", "arriendo", "alquiler", "rent", "servicio", "util", "habitat"],
  },
  {
    // Transporte — movilidad urbana, vehículo propio, combustible
    keywords: [
      "taxi", "uber", "didi", "beat", "cabify", "indriver", "picap", "taxis libres",
      "bus", "buseta", "metro", "transmilenio", "sitp", "mio", "metroplús", "metroplus",
      "megabús", "megabus", "tren de la sabana", "cable aéreo", "cable aereo",
      "gasolina", "acpm", "combustible", "diesel", "extra", "corriente gasolina",
      "terpel", "ecopetrol", "biomax", "estación servicio", "bomba gasolina",
      "peaje", "autopista",
      "parqueo", "parqueadero", "estacionamiento",
      "aceite motor", "cambio aceite", "filtro", "llantas", "frenos", "batería carro",
      "taller mecánico", "taller mecanico", "mecánico", "mecanico",
      "revisión técnico mecánica", "tecnicomecánica", "tecnicomecanica",
      "seguro carro", "soat", "multa tránsito", "comparendo",
      "bicicleta", "cicla", "patineta", "scooter", "moto",
      "vuelo nacional", "bus intermunicipal", "flota", "expreso", "berlinas",
    ],
    catPatterns: ["transporte", "transport", "movil", "movilidad", "auto", "carro", "vehiculo", "taxi", "vehículo"],
  },
  {
    // Salud — médicos, medicamentos, seguros médicos, bienestar físico
    keywords: [
      "médico", "medico", "doctor", "consulta médica", "consulta medica", "cita médica", "cita medica",
      "especialista", "cardiólogo", "dermatologo", "dermatólogo", "ginecólogo", "ginecologo",
      "neurólogo", "neurologo", "ortopedista", "traumatólogo", "traumatologo",
      "psicólogo", "psicologo", "psiquiatra", "nutricionista", "fisioterapeuta",
      "fonoaudiólogo", "optómetra", "optometra",
      "hospital", "clínica", "clinica", "urgencias", "cirugía", "cirugia", "operación",
      "farmacia", "droguería", "drogueria", "cruz verde", "copidrogas", "colsubsidio drogas",
      "medicina", "medicamento", "pastilla", "ampolleta", "jarabe", "antibiótico",
      "anticonceptivo", "vitamina", "suplemento",
      "dentista", "odontólogo", "odontologo", "ortodoncia", "calza", "extracción", "corona dental",
      "óptica", "optica", "lentes", "gafas", "montura",
      "examen", "laboratorio clínico", "hemograma", "uroanálisis", "ecografía",
      "radiografía", "tomografía", "resonancia",
      "eps", "prepagada", "colmédica", "sura salud", "coomeva", "sanitas", "medisanitas",
      "arl", "seguro de vida", "medicina prepagada",
      "spa", "masaje terapéutico", "fisioterapia",
    ],
    catPatterns: ["salud", "health", "medic", "farmacia", "clinica", "bienestar", "wellnes"],
  },
  {
    // Entretenimiento — streaming, deporte, salidas, cultura
    keywords: [
      "netflix", "disney", "disney plus", "hbo", "hbo max", "amazon prime", "apple tv",
      "crunchyroll", "star plus", "star+", "paramount", "mubi", "vix",
      "spotify", "apple music", "youtube premium", "deezer", "tidal",
      "youtube", "twitch", "patreon",
      "cine", "cinépolis", "cinepolis", "cinecolombia", "royal films", "película",
      "teatro", "concierto", "festival", "estéreo picnic", "estereo picnic", "rock al parque",
      "planetario", "museo", "exposición", "exposicion",
      "gym", "gimnasio", "smart fit", "bodytech", "body tech", "iron gym",
      "yoga", "crossfit", "pilates", "spinning", "natación", "natacion", "piscina",
      "fútbol", "futbol", "baloncesto", "voleibol", "tenis", "pádel", "padel",
      "ciclismo", "running", "maratón", "maraton", "senderismo", "escalar",
      "videojuego", "playstation", "xbox", "nintendo", "steam", "epic games",
      "rumba", "bar", "discoteca", "taberna", "pub", "antro",
      "licor", "trago", "aguardiente", "ron", "whisky", "vino", "cerveza",
      "parque", "paseo", "excursión", "excursion", "salida",
      "fiesta", "celebración", "celebracion", "reunión", "reunion",
    ],
    catPatterns: ["entret", "ocio", "diversión", "diversion", "recreac", "deporte", "gym", "bienestar", "leisure"],
  },
  {
    // Ropa y moda
    keywords: [
      "ropa", "vestimenta", "vestido", "camisa", "camiseta", "pantalón", "pantalon",
      "jean", "jeans", "buzo", "sudadera", "chaqueta", "abrigo", "impermeable",
      "zapatos", "calzado", "tenis", "zapatillas", "botas", "sandalias", "tacones",
      "corbata", "cinturón", "cinturon", "correa", "billetera", "bolso", "cartera", "maleta",
      "accesorios", "gorra", "sombrero", "bufanda", "guantes", "gafas de sol",
      "ropa interior", "medias", "calcetines", "pijama", "traje de baño", "vestido de baño",
      "zara", "h&m", "studio f", "armi", "tennis", "vélez", "velez", "arturo calle",
      "bershka", "pull and bear", "stradivarius", "massimo dutti",
    ],
    catPatterns: ["ropa", "vestim", "moda", "cloth", "calzado", "fashion"],
  },
  {
    // Tecnología y electrónica
    keywords: [
      "celular", "teléfono", "telefono", "smartphone", "iphone", "samsung", "pixel", "huawei",
      "laptop", "portátil", "portatil", "computador", "computadora", "pc", "mac", "macbook",
      "tablet", "ipad", "kindle", "monitor", "pantalla", "televisor", "tv",
      "auriculares", "audífonos", "audifonos", "airpods", "parlante", "parlantes",
      "smartwatch", "reloj inteligente", "cámara", "camara", "dron", "drone",
      "teclado", "mouse", "ratón", "disco duro", "ssd", "usb", "memoria",
      "cargador", "cable", "adaptador", "funda", "case celular",
      "impresora", "escáner", "escaner", "router", "modem",
      "apple", "microsoft", "google", "amazon", "sony", "lg", "asus", "lenovo", "dell", "hp",
      "antivirus", "software", "licencia", "aplicación", "app",
      "plan celular", "minutos", "datos", "recargas", "paquete datos",
      "claro", "tigo", "movistar", "wom", "virgin mobile",
    ],
    catPatterns: ["tecno", "electro", "digi", "tech", "gadget", "celular", "telecom", "comput"],
  },
  {
    // Belleza y cuidado personal
    keywords: [
      "peluquería", "peluqueria", "barbería", "barberia", "salón", "salon de belleza",
      "manicure", "pedicure", "nail", "uñas", "tinte", "tintura", "corte de cabello",
      "mechas", "tratamiento capilar", "alisado", "permanente", "extensiones",
      "depilación", "depilacion", "cera", "laser",
      "spa", "facial", "limpieza facial", "masaje", "masaje relajante",
      "crema", "hidratante", "serum", "bloqueador", "protector solar",
      "shampoo", "acondicionador", "mascarilla cabello",
      "maquillaje", "labial", "base", "rímel", "rimel", "sombra", "rubor",
      "perfume", "colonia", "desodorante", "jabón", "gel de ducha",
      "cepillo dental", "pasta dental", "hilo dental", "enjuague bucal",
      "pañales", "toallas higiénicas", "toallas sanitarias",
    ],
    catPatterns: ["belleza", "personal", "cuidado", "estet", "cosmet", "higien", "grooming"],
  },
  {
    // Educación y formación
    keywords: [
      "universidad", "unal", "uniandes", "javeriana", "rosario", "ean", "sena",
      "politécnico", "politecnico", "institución educativa", "colegio", "jardín", "jardin",
      "matrícula", "matricula", "pensión", "pension educativa", "semestre",
      "curso", "diplomado", "posgrado", "maestría", "maestria", "doctorado",
      "clase", "taller", "seminario", "congreso", "conferencia",
      "libro", "libros", "texto", "cuaderno", "útiles", "utiles", "papelería", "papeleria",
      "esfero", "marcador", "calculadora", "regla",
      "coursera", "udemy", "platzi", "edx", "linkedin learning", "domestika",
      "certificado", "certificación", "certificacion", "capacitación", "capacitacion",
    ],
    catPatterns: ["educa", "estudio", "universid", "academ", "capacit", "formac"],
  },
  {
    // Mascotas
    keywords: [
      "mascota", "perro", "gato", "pájaro", "pajaro", "pez", "conejo", "hámster", "hamster",
      "veterinaria", "veterinario", "veterinaría",
      "vacuna perro", "vacuna gato", "desparasitación", "desparasitacion",
      "baño mascota", "peluquería canina", "peluqueria canina", "adiestramiento",
      "concentrado", "pienso", "comida perro", "comida gato", "purina", "pedigree", "whiskas",
      "collar", "correa", "jaula", "cama mascota", "juguete mascota",
      "arena gato", "huesos perro",
    ],
    catPatterns: ["mascota", "pet", "animal", "veterinar"],
  },
  {
    // Viajes y turismo
    keywords: [
      "vuelo", "tiquete", "tiquete aéreo", "tiquete aereo", "pasaje aéreo", "pasaje aereo",
      "avianca", "latam", "viva", "satena", "jetsmart", "aerolínea", "aerolinea",
      "hotel", "hospedaje", "posada", "hostal", "hostel", "airbnb", "booking",
      "bus intermunicipal", "flota", "expreso", "berlinas", "copetran", "bolivariano",
      "crucero", "excursión", "excursion", "tour", "paquete turístico", "paquete turistico",
      "visa", "pasaporte", "seguro de viaje",
      "maleta", "equipaje", "mochila de viaje",
      "souvenirs", "artesanías", "artesanias",
      "cartagena", "medellín", "san andrés", "san andres", "santa marta", "villa de leyva",
    ],
    catPatterns: ["viaje", "travel", "turism", "vacac", "hotel", "hosped"],
  },
  {
    // Seguros
    keywords: [
      "soat", "seguro carro", "seguro moto", "seguro hogar", "seguro vida",
      "seguro de salud", "póliza", "poliza", "prima seguro",
      "arl", "arl positiva", "colmena", "sura seguros", "mapfre", "allianz",
      "seguros bolívar", "seguros bolivar", "liberty", "zurich",
    ],
    catPatterns: ["seguro", "insur", "póliza", "poliza"],
  },
  {
    // Servicios financieros y bancarios
    keywords: [
      "cuota manejo", "cuota de manejo", "4x1000", "gmf", "gravamen", "intereses",
      "interés bancario", "interes bancario", "comisión bancaria", "comision bancaria",
      "tarjeta crédito", "tarjeta credito", "cuota tarjeta", "pago mínimo", "pago minimo",
      "crédito", "credito", "préstamo", "prestamo", "cuota préstamo", "cuota prestamo",
      "deuda", "abono deuda", "cuota crédito", "cuota credito",
      "bancolombia", "davivienda", "bbva", "bogotá banco", "colpatria", "nequi", "daviplata",
    ],
    catPatterns: ["banco", "financ", "crédito", "credito", "deuda", "préstam", "prestam", "cuota"],
  },
  {
    // Regalos y socialización
    keywords: [
      "regalo", "obsequio", "presente", "flores", "chocolates regalo",
      "cumpleaños", "boda", "matrimonio", "quinceaños", "quinceañera",
      "baby shower", "grado", "graduación", "graduacion",
      "navidad", "amor y amistad", "día de la madre", "dia de la madre",
      "día del padre", "dia del padre",
      "tarjeta regalo", "gift card",
      "vaca", "colecta", "rifas", "bingo", "tombola",
      "donación", "donacion", "caridad", "limosna",
    ],
    catPatterns: ["regalo", "gift", "social", "fiest", "celebr", "donac", "obsequio"],
  },
  {
    // Impuestos y obligaciones
    keywords: [
      "impuesto", "predial", "impuesto vehículo", "impuesto vehiculo",
      "declaración de renta", "declaracion de renta", "dian",
      "iva", "ica", "retefuente", "retención", "retencion",
      "multa", "comparendo", "sanción", "sancion",
      "cámara de comercio", "camara de comercio", "renovación matrícula", "renovacion matricula",
    ],
    catPatterns: ["impuest", "tax", "tribut", "dian", "fiscal", "multa"],
  },
  {
    // Suscripciones (genérico — apps, servicios recurrentes)
    keywords: [
      "suscripción", "suscripcion", "subscripción", "subscripcion",
      "membresía", "membresia", "mensualidad servicio", "plan mensual",
      "afiliación", "afiliacion", "renovación", "renovacion", "anualidad",
      "adobe", "notion", "slack", "dropbox", "icloud", "google one", "office 365",
      "microsoft 365", "antivirus kaspersky", "norton",
    ],
    catPatterns: ["suscr", "subscr", "memb", "afilia", "recurrent"],
  },
  {
    // Ingresos — salario, honorarios, ventas, transferencias recibidas
    keywords: [
      "salario", "sueldo", "nómina", "nomina", "quincena", "quincenita",
      "honorario", "honorarios", "freelance", "consultoría", "consultoria",
      "comisión cobrada", "comision cobrada", "bono", "prima", "prima de servicios",
      "liquidación", "liquidacion", "cesantías", "cesantias", "vacaciones pagadas",
      "horas extra", "horas extras", "recargo nocturno",
      "arriendo recibido", "ingreso arriendo", "canon cobrado",
      "venta", "ventas", "ingreso por venta", "factura cobrada",
      "dividendos", "rendimientos", "intereses recibidos",
      "transferencia recibida", "consignación", "consignacion",
      "pago recibido", "cobro cliente",
    ],
    catPatterns: ["salario", "sueldo", "nómina", "nomina", "ingreso", "trabajo", "laboral", "honorar", "venta"],
  },
];

/** Match a desc string against concept keywords, then find the best-fit category
 *  from the user's actual category list using pattern matching. */
function semanticCategoryMatch(desc: string, catList: string[]): string | null {
  const dl = desc.toLowerCase();
  for (const concept of CONCEPT_MAP) {
    if (!concept.keywords.some(kw => dl.includes(kw))) continue;
    for (const cat of catList) {
      if (concept.catPatterns.some(p => cat.toLowerCase().includes(p))) return cat;
    }
  }
  return null;
}

const OTHER_IN  = "Otro ingreso";
const OTHER_OUT = "Otro gasto";

const COP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const PERIOD_LABEL: Record<Period, string> = { semanal: "semanal", mensual: "mensual", anual: "anual" };

interface EditInitial {
  type: TxType;
  amount: number;
  desc: string;
  date: string;
  category: string;
  accountId?: string;
}

export default function ModalMovimiento({
  onClose,
  bankAccounts = [],
  categories = [],
  finances = [],
  budgets = [],
  budgetConfigs = [],
  editId,
  editInitial,
}: {
  onClose: () => void;
  bankAccounts?: BankAccount[];
  categories?: Category[];
  finances?: Finance[];
  budgets?: Budget[];
  budgetConfigs?: BudgetConfig[];
  editId?: string;
  editInitial?: EditInitial;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!editId;

  const buildCats = (t: TxType) => {
    const other = t === "ingreso" ? OTHER_IN : OTHER_OUT;
    const fromDb = categories.filter(c => c.type === t).map(c => c.name);
    if (fromDb.length > 0) {
      if (!fromDb.includes(other)) fromDb.push(other);
      return fromDb;
    }
    // fallback to hardcoded list when categories not loaded
    return t === "ingreso" ? CATS_IN : CATS_OUT;
  };

  const initType = editInitial?.type ?? "egreso";
  const initCats = buildCats(initType);

  const initCatInList = editInitial ? initCats.find(c => c === editInitial.category) ?? null : null;
  const initCategory = initCatInList ?? (initType === "ingreso" ? OTHER_IN : OTHER_OUT);
  const initCustomCat = (!initCatInList && editInitial?.category) ? editInitial.category : "";

  const [type, setType]           = useState<TxType>(initType);
  const [amount, setAmount]       = useState(editInitial?.amount ? String(Math.round(editInitial.amount)) : "");
  const [desc, setDesc]           = useState(editInitial?.desc ?? "");
  const [dateISO, setDateISO]     = useState(editInitial?.date ?? today());
  const [accountId, setAccountId] = useState(editInitial?.accountId ?? "");
  const [saving, setSaving]       = useState(false);
  const [customCat, setCustomCat] = useState(initCustomCat);
  const [category, setCategory]   = useState(initCategory);
  const [quickText, setQuickText] = useState("");
  const [quickApplied, setQuickApplied] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catUserPicked = useRef(false);

  // Auto-focus the quick-add input when opening a new movement
  useEffect(() => {
    if (!isEdit) quickRef.current?.focus();
  }, [isEdit]);

  // Auto-categorize from history when desc changes
  useEffect(() => {
    if (isEdit || catUserPicked.current || desc.length < 3) return;
    const q = desc.toLowerCase();
    const match = [...finances]
      .filter(f => f.type === type && (f.desc ?? "").toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!match) return;
    const inList = buildCats(type).includes(match.category);
    if (inList) setCategory(match.category);
    else { setCategory(type === "ingreso" ? OTHER_IN : OTHER_OUT); setCustomCat(match.category); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desc, type]);

  // Parse dictated text into amount + description + detected transaction type.
  // Handles digits, "N mil", "N millón(es)", and full Spanish word numbers.
  const parseVoiceText = (text: string): { amount: number; desc: string; detectedType?: TxType } | null => {
    const INGRESO_KW = /\b(ingreso|recibí|recibi|cobré|cobre|entrada|depósito|deposito)\b/i;
    const EGRESO_KW  = /\b(egreso|gasto|compra|gasté|gaste|pagué|pague|salida)\b/i;

    let raw = text.trim().replace(/\s+/g, " ");
    let detectedType: TxType | undefined;
    if (INGRESO_KW.test(raw)) { detectedType = "ingreso"; raw = raw.replace(INGRESO_KW, "").trim(); }
    else if (EGRESO_KW.test(raw)) { detectedType = "egreso"; raw = raw.replace(EGRESO_KW, "").trim(); }

    const words = raw.split(/\s+/).filter(Boolean);
    const parsed = parseAmountAndDesc(words);
    if (!parsed) return null;
    return { ...parsed, detectedType };
  };

  // Frequency-based auto-categorization: most common category for this description + type
  const autoCatFromHistory = (descText: string, txType: TxType): string | null => {
    if (!descText) return null;
    const q = descText.toLowerCase();
    const hits = finances.filter(f => f.type === txType && (f.desc ?? "").toLowerCase().includes(q));
    if (!hits.length) return null;
    const freq: Record<string, number> = {};
    for (const f of hits) freq[f.category] = (freq[f.category] ?? 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  };

  const applyQuick = useCallback((text: string) => {
    const parsed = parseVoiceText(text);
    if (!parsed) return false;

    const effectiveType: TxType = parsed.detectedType ?? type;
    if (parsed.detectedType && parsed.detectedType !== type) {
      setType(parsed.detectedType);
      setCategory(buildCats(parsed.detectedType)[0]);
      setCustomCat("");
      catUserPicked.current = false;
    }

    setAmount(String(parsed.amount));

    let finalDesc = parsed.desc;
    let resolvedCat: string | null = null;

    if (parsed.desc) {
      // 1. Try to find a category name explicitly mentioned in the dictated text.
      //    Match any category whose name appears (partially) in the desc words.
      const catList = buildCats(effectiveType).filter(c => c !== OTHER_IN && c !== OTHER_OUT);
      const descLower = parsed.desc.toLowerCase();
      for (const cat of catList) {
        const catLower = cat.toLowerCase();
        if (descLower.includes(catLower)) {
          resolvedCat = cat;
          finalDesc = parsed.desc.replace(new RegExp(catLower, "i"), "").replace(/\s+/g, " ").trim();
          break;
        }
        // Also try if any word in desc is a prefix of the category (≥4 chars)
        const descWords = descLower.split(/\s+/);
        for (const w of descWords) {
          if (w.length >= 4 && catLower.startsWith(w)) {
            resolvedCat = cat;
            finalDesc = parsed.desc.replace(new RegExp(`\\b${w}\\b`, "i"), "").replace(/\s+/g, " ").trim();
            break;
          }
        }
        if (resolvedCat) break;
      }

      // 2. Semantic concept match (food → Alimentación, arriendo → Casa, etc.)
      if (!resolvedCat) {
        const catList = buildCats(effectiveType).filter(c => c !== OTHER_IN && c !== OTHER_OUT);
        resolvedCat = semanticCategoryMatch(finalDesc || parsed.desc, catList);
      }

      // 3. Fall back to frequency-based history match
      if (!resolvedCat) resolvedCat = autoCatFromHistory(finalDesc || parsed.desc, effectiveType);
    }

    if (finalDesc) setDesc(finalDesc);

    if (resolvedCat) {
      const inList = buildCats(effectiveType).includes(resolvedCat);
      catUserPicked.current = true;
      if (inList) setCategory(resolvedCat);
      else { setCategory(effectiveType === "ingreso" ? OTHER_IN : OTHER_OUT); setCustomCat(resolvedCat); }
    }

    setQuickText("");
    setQuickApplied(true);
    setTimeout(() => setQuickApplied(false), 1500);
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finances, type]);

  const cats = buildCats(type);
  const isOther = category === OTHER_IN || category === OTHER_OUT;
  const finalCat = isOther ? customCat.trim() || category : category;

  const monto = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSave = monto > 0 && desc.trim().length > 0 && (!isOther || customCat.trim().length > 0);

  // Non-blocking budget warnings, anchored to the transaction's date
  const budgetWarnings: string[] = [];
  if (type === "egreso" && monto > 0 && dateISO) {
    const anchor = new Date(dateISO + "T00:00:00");
    const catLower = finalCat.trim().toLowerCase();
    for (const p of ["semanal", "mensual", "anual"] as Period[]) {
      const { from, to } = getPeriodRange(p, anchor);
      // exclude the row being edited so its old amount doesn't double-count
      const inPeriod = finances.filter(f => f.type === "egreso" && f.id !== editId && f.date >= from && f.date <= to);

      const total = budgetConfigs.find(c => c.period === p)?.amount ?? 0;
      if (total > 0) {
        const spent = inPeriod.reduce((s, f) => s + f.amount, 0);
        if (spent + monto > total) {
          budgetWarnings.push(`Superarás tu presupuesto ${PERIOD_LABEL[p]} por ${COP(spent + monto - total)}`);
        }
      }

      const catBudget = budgets.find(b => b.period === p && b.category.toLowerCase() === catLower);
      if (catBudget && catBudget.amount > 0) {
        const spentCat = inPeriod.filter(f => f.category.toLowerCase() === catLower).reduce((s, f) => s + f.amount, 0);
        if (spentCat + monto > catBudget.amount) {
          budgetWarnings.push(`Superarás el límite ${PERIOD_LABEL[p]} de "${catBudget.category}" por ${COP(spentCat + monto - catBudget.amount)}`);
        }
      }
    }
  }

  // Duplicate detection: same category + amount within ±3 days, excluding self
  const duplicateWarning = (() => {
    if (!monto || !dateISO || !finalCat) return null;
    const anchor = new Date(dateISO + "T00:00:00").getTime();
    const THREE_DAYS = 3 * 86400000;
    const dup = finances.find(f =>
      f.id !== editId &&
      f.type === type &&
      f.category.toLowerCase() === finalCat.toLowerCase() &&
      Math.abs(f.amount - monto) < 1 &&
      Math.abs(new Date(f.date + "T00:00:00").getTime() - anchor) <= THREE_DAYS
    );
    return dup ? `Posible duplicado: ya registraste ${COP(dup.amount)} en "${dup.category}" el ${dup.date}` : null;
  })();

  const switchType = (t: TxType) => {
    setType(t);
    const newCats = buildCats(t);
    setCategory(newCats[0]);
    setCustomCat("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const acct = bankAccounts.find(b => b.id === accountId);
      const item = {
        type,
        amount: monto,
        desc: desc.trim(),
        category: finalCat,
        date: dateISO,
        accountId: accountId === "cash" ? "cash" : acct?.id,
        accountName: accountId === "cash" ? "Efectivo" : acct?.name,
      };
      if (isEdit) {
        await updateFinance(editId!, item);
        router.refresh();
        onClose();
      } else {
        // Online path: try server action first
        if (navigator.onLine) {
          try {
            await addFinance(item);
            router.refresh();
            onClose();
            return;
          } catch {
            // fall through to local queue
          }
        }
        // Offline or server action failed — queue locally
        try {
          await enqueue(item);
          toast.info("Guardado offline — se sincronizará al conectarse");
          onClose();
        } catch {
          toast.error("No se pudo guardar. Verifica tu conexión e intenta de nuevo.");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Editar movimiento" : "Registrar movimiento"}
      onClose={onClose}
      footer={<CancelSave onClose={onClose} onSave={save} canSave={canSave} saving={saving} />}
    >
      {/* Quick-add: dictate or type "35.000 almuerzo" → fills all fields */}
      {!isEdit && (
        <div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none select-none">
              🎤
            </span>
            <input
              ref={quickRef}
              value={quickText}
              onChange={e => {
                const val = e.target.value;
                setQuickText(val);
                if (parseTimer.current) clearTimeout(parseTimer.current);
                if (val.trim()) parseTimer.current = setTimeout(() => applyQuick(val), 900);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (parseTimer.current) { clearTimeout(parseTimer.current); parseTimer.current = null; }
                  applyQuick(quickText);
                }
              }}
              placeholder='Dicta o escribe: "35.000 almuerzo"'
              className={[
                fieldClass,
                "pl-9",
                quickApplied ? "border-pos/60 bg-pos/5" : "",
              ].join(" ")}
            />
          </div>
          <p className="text-[11px] text-dim mt-1 text-center">
            Activa el dictado del sistema y habla · o escribe y presiona Enter
          </p>
        </div>
      )}

      <div className="flex bg-panel2 rounded-xl p-0.75">
        {(["ingreso", "egreso"] as TxType[]).map(t => (
          <button
            key={t}
            onClick={() => switchType(t)}
            className={[
              "flex-1 h-8.5 rounded-[9px] border-none cursor-pointer text-[13px] font-medium capitalize",
              type === t ? "bg-accent text-accentFg" : "bg-transparent text-muted",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>Monto</label>
        <MoneyInput value={amount} onChange={setAmount} prefix="$" />
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Ej. Salario, Mercado…"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Categoría</label>
        <select
          value={category}
          onChange={e => { catUserPicked.current = true; setCategory(e.target.value); setCustomCat(""); }}
          className={fieldClass}
        >
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isOther && (
        <div>
          <label className={labelClass}>Nueva categoría</label>
          <input
            value={customCat}
            onChange={e => setCustomCat(e.target.value)}
            placeholder={type === "ingreso" ? "Ej. Dividendos" : "Ej. Salud"}
            className={fieldClass}
            autoFocus
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Fecha</label>
        <input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className={fieldClass} />
      </div>

      <div>
        <label className={labelClass}>Cuenta</label>
        <select value={accountId} onChange={e => setAccountId(e.target.value)} className={fieldClass}>
          <option value="">— Sin cuenta —</option>
          {!bankAccounts.some(b => b.name.toLowerCase().includes('efectivo')) && <option value="cash">Efectivo</option>}
          {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {duplicateWarning && (
        <div
          className="rounded-xl border px-3.5 py-2.5 flex flex-col gap-1"
          style={{ borderColor: "#6366f1", background: "color-mix(in srgb, #6366f1 8%, transparent)" }}
        >
          <div className="text-xs font-medium" style={{ color: "#818cf8" }}>⟳ {duplicateWarning}</div>
          <div className="text-[11px] text-dim">Si es diferente, puedes registrarlo igual.</div>
        </div>
      )}

      {budgetWarnings.length > 0 && (
        <div
          className="rounded-xl border px-3.5 py-2.5 flex flex-col gap-1"
          style={{ borderColor: "#f59e0b", background: "color-mix(in srgb, #f59e0b 8%, transparent)" }}
        >
          {budgetWarnings.map(w => (
            <div key={w} className="text-xs font-medium" style={{ color: "#f59e0b" }}>⚠ {w}</div>
          ))}
          <div className="text-[11px] text-dim">Puedes registrarlo de todas formas.</div>
        </div>
      )}
    </ModalShell>
  );
}
