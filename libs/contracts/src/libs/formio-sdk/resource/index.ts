import { UtilizationResponseTermsDTO } from '../../licenses/terms.dto';
import { SubmissionDTO, UserDataDTO } from '..';

export * from './license-admin.dto';
export * from './resource-settings.dto';
export * from './user-data.dto';

/**
 * Built types
 */
export class LicenseDTO extends SubmissionDTO<UtilizationResponseTermsDTO> {}
export class UserDTO extends SubmissionDTO<UserDataDTO> {}
