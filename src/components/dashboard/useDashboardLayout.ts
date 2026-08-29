import { useMemo, useState } from 'react'
import { WIDGET_BY_ID, WIDGET_IDS, type WidgetId } from './widgetDefinitions'

export interface WidgetLayoutEntry {
  id: WidgetId
  visible: boolean
}

const STORAGE_KEY = 'nexora.dashboardWidgets'

function defaultLayout(): WidgetLayoutEntry[] {
  return WIDGET_IDS.map((id) => ({ id, visible: true }))
}

function readStoredLayout(): WidgetLayoutEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultLayout()
    const parsed = JSON.parse(raw) as WidgetLayoutEntry[]
    const stored = parsed.filter((entry) => entry && WIDGET_BY_ID[entry.id])
    // Widgets que el usuario nunca configuró (agregados en una versión
    // posterior de la app) se agregan al final, visibles por defecto — así
    // una preferencia ya guardada nunca "pierde" widgets nuevos.
    const knownIds = new Set(stored.map((entry) => entry.id))
    const missing = WIDGET_IDS.filter((id) => !knownIds.has(id)).map((id) => ({ id, visible: true }))
    return [...stored, ...missing]
  } catch {
    return defaultLayout()
  }
}

function persist(layout: WidgetLayoutEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Se pierde la preferencia al recargar, pero la sesión actual sigue funcionando.
  }
}

/**
 * Orden y visibilidad de los widgets del dashboard (plan.md, sección 10:
 * "agregar, eliminar y reordenar widgets"), persistidos en localStorage con
 * el mismo patrón que la preferencia de tema (theme/ThemeModeContext.tsx) —
 * es una preferencia solo de este navegador, no del usuario en el backend.
 */
export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetLayoutEntry[]>(readStoredLayout)

  const update = (next: WidgetLayoutEntry[]) => {
    setLayout(next)
    persist(next)
  }

  const toggleVisible = (id: WidgetId) => {
    update(layout.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry)))
  }

  const move = (id: WidgetId, direction: -1 | 1) => {
    const index = layout.findIndex((entry) => entry.id === id)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= layout.length) return
    const next = [...layout]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    update(next)
  }

  const resetToDefault = () => update(defaultLayout())

  const visibleWidgetIds = useMemo(() => layout.filter((entry) => entry.visible).map((entry) => entry.id), [layout])

  return { layout, visibleWidgetIds, toggleVisible, move, resetToDefault }
}
