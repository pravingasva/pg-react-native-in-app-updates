export {
  AndroidUpdateType as IAUUpdateKind,
  AndroidAvailabilityStatus as IAUAvailabilityStatus,
  AndroidInstallStatus as IAUInstallStatus,
  AndroidOther as IAUOther,
  IAU_UPDATE_TYPE_AUTO,
  IAUUpdatePriority,
} from './types';

// @ts-expect-error
import InAppUpdates from './InAppUpdates';

export default InAppUpdates;
