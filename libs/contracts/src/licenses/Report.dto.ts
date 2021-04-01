import {
  IsDateString,
  IsEnum,
  IsObjectId,
  IsString,
} from '@automagical/validation';
import { LicenseAdminDTO } from '../formio-sdk/resource/LicenseAdmin.dto';
import { LicenseApiServer } from './ApiServer.dto';

enum ProjectType {
  stage = 'stage',
  project = 'project',
  livestage = 'livestage',
}

export class LicenseItemCommonDTO {
  // #region Object Properties

  @IsEnum(ProjectType)
  public projectType: ProjectType;
  @IsObjectId()
  public id: string;
  @IsObjectId()
  public projectId: string;
  @IsString()
  public name: string;
  @IsString()
  public title: string;

  public remote: 'false' | 'true';
  public status: '0' | '1';

  // #endregion Object Properties
}

// export type LicenseFormManager = LicenseItemCommon & {
//   licenseId: string;
//   stageId: string;
//   tenantId: string;
//   type?: 'formManager';
// };

export class LicenseItemDTO extends LicenseItemCommonDTO {
  // #region Object Properties

  @IsDateString()
  public lastCheck: string;

  // #endregion Object Properties
}

export class LicenseReportDTO {
  // #region Object Properties

  public admin: LicenseAdminDTO;
  apiServer?: LicenseApiServer[];
  formManager?: LicenseItemDTO[];
  pdfServers?: unknown[];
  projects?: LicenseItemDTO[];
  stages?: LicenseItemDTO[];
  tenants?: unknown[];

  // #endregion Object Properties
}