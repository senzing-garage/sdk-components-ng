import { SzLicenseUpgradeType } from "./data-license";

/** 
 * when a user clicks on a "upgrade" button.
 * @internal
 */
export interface SzLicenseUpgradeMouseEvent extends MouseEvent {
    upgradeType: SzLicenseUpgradeType
}