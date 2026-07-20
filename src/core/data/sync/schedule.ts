import { getSyncConfig } from '@/core/data/settings/store'
import { browser } from '@/platform'
import { createLogger } from '@/shared/util/logger'
import { syncBackup } from './service'

const log = createLogger('sync')
const ALARM = 'sync-backup'
const PERIOD_MIN = 30

// biome-ignore lint/suspicious/noExplicitAny: chrome.alarms is optional / loosely typed.
const alarms = () => (browser as any).alarms

/** (Re)schedules the periodic auto-backup alarm to match the current config:
 * a repeating alarm only while mode is 'auto' and a provider is connected. */
export async function rescheduleSync(): Promise<void> {
  const a = alarms()
  if (!a) return
  await a.clear(ALARM)
  const { mode, providerId } = await getSyncConfig()
  if (mode === 'auto' && providerId) a.create(ALARM, { periodInMinutes: PERIOD_MIN })
}

/** Registers the alarm listener at startup and syncs the schedule to config.
 * Auto-backup is push-only (never auto-restore); a failure can't crash the
 * worker, but it IS logged — a permanently failing backup (expired token,
 * moved file) should be visible, not silent. */
export function registerSyncAlarm(): void {
  const a = alarms()
  if (!a) return
  a.onAlarm.addListener((alarm: { name: string }) => {
    if (alarm.name === ALARM)
      void syncBackup().catch((e) => log.warn('auto-backup failed', String(e)))
  })
  void rescheduleSync()
}
