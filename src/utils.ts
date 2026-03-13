import semver from 'semver';
import type { SemverVersion } from './types';
import { AndroidUpdateType } from './types';

export const compareVersions = (
  versionToCheck: SemverVersion,
  checkAgainst: SemverVersion
) => {
  if (versionToCheck && checkAgainst) {
    // The version consists of 3 parts.
    // 1 MAJOR, 2 MINOR, 3 LIVE_RELOAD_REV each of which contain 3 digits

    return semver.compare(
      // @ts-ignore
      semver.coerce(versionToCheck),
      semver.coerce(checkAgainst)
    );
  }
  if (versionToCheck && checkAgainst == null) {
    return 1;
  }
  if (checkAgainst && versionToCheck == null) {
    return -1;
  }
  return 0;
};

export function updateKindFromPriority(
  priority: number,
  stalenessDays?: number
): AndroidUpdateType {
  if (priority >= 4) return AndroidUpdateType.IMMEDIATE;
  if (priority >= 2) return AndroidUpdateType.FLEXIBLE;
  // Optional: staleness fallback — if low priority but very stale, force flexible
  if (stalenessDays !== undefined && stalenessDays >= 14)
    return AndroidUpdateType.FLEXIBLE;
  return AndroidUpdateType.FLEXIBLE;
}
