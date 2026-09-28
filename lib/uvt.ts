// UVT (Unidad de Valor Tributario) por año gravable, certificada por la DIAN
// en diciembre del año anterior. Fuente compartida con app/datos/uvt-historica.
export const UVT_BY_YEAR: Record<number, number> = {
  2026: 52_374,
  2025: 49_799,
  2024: 47_065,
  2023: 42_412,
  2022: 38_004,
  2021: 36_308,
  2020: 35_607,
  2019: 34_270,
  2018: 33_156,
  2017: 31_859,
  2016: 29_753,
};

const LATEST_KNOWN_YEAR = Math.max(...Object.keys(UVT_BY_YEAR).map(Number));

// Tope de "consignaciones bancarias, depósitos o inversiones financieras"
// para quedar obligado a declarar renta: 1.400 UVT del año gravable.
export function dianConsignacionesThreshold(year: number): number {
  const uvt = UVT_BY_YEAR[year] ?? UVT_BY_YEAR[LATEST_KNOWN_YEAR];
  return uvt * 1400;
}
