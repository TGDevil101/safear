import type { ModuleConfig } from './types'
import { moduleFire } from './module1-fire'
import { moduleGas } from './module2-gas'

/** Ordered — module N+1 unlocks only once module N is passed. */
export const MODULES: ModuleConfig[] = [moduleFire, moduleGas]

export function getModule(id: string | undefined): ModuleConfig | undefined {
  return MODULES.find((m) => m.id === id)
}

export * from './types'
