import { AUTONOMY_LABELS, AUTONOMY_SHORT, type Autonomy } from '@/shared/autonomy'
import { t } from '@/shared/util/i18n'

/** 'auto-low' → 'AutoLow' — chrome.i18n keys allow no dashes. */
const suffix = (a: Autonomy): string => a.replace(/(?:^|-)(\w)/g, (_, c: string) => c.toUpperCase())

/** Localized full autonomy label (Settings, tooltips). */
export const autonomyLabel = (a: Autonomy): string => t(`autonomy${suffix(a)}`, AUTONOMY_LABELS[a])

/** Localized one-word autonomy label (the composer picker). */
export const autonomyShort = (a: Autonomy): string =>
  t(`autonomyShort${suffix(a)}`, AUTONOMY_SHORT[a])
