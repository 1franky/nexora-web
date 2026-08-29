/**
 * Tokens de la paleta de referencia (skill dataviz), solo los roles que
 * usamos: todo el dashboard es de un solo hue (azul, el "sequential
 * default"/slot categórico 1) — ninguna gráfica aquí distingue series por
 * identidad, todas comparan magnitud (gasto por categoría, evolución en el
 * tiempo), así que un solo color es lo correcto (ver choosing-a-form.md:
 * "Compare magnitude... sequential (one hue)"; nominal bars nunca se
 * colorean por su valor).
 */
export interface ChartPalette {
  surface: string
  textPrimary: string
  textSecondary: string
  muted: string
  gridline: string
  baseline: string
  series: string
  seriesWash: string
}

const LIGHT: ChartPalette = {
  surface: '#fcfcfb',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  series: '#2a78d6',
  seriesWash: 'rgba(42, 120, 214, 0.1)',
}

const DARK: ChartPalette = {
  surface: '#1a1a19',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  muted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
  series: '#3987e5',
  seriesWash: 'rgba(57, 135, 229, 0.1)',
}

export function getChartPalette(mode: 'light' | 'dark'): ChartPalette {
  return mode === 'dark' ? DARK : LIGHT
}
