import { APP_HOME_CONTROLLER } from '../constants';
import { CreateConfigurableAnnotation } from '../decorators';
import {
  AuthenticationConfig,
  DevtoolsApplicationSettingsDTO,
  FormioSDKConfig,
  ServerConfig,
  UtilsConfig,
} from '.';
import { HomeControllerApplicationSettingsDTO } from './apps';
import { CommonConfig } from './common';
import { CustomLogicConfig } from './custom';
import { HomeAssistantConfig } from './home-assistant';

const ConfigurableProperty = CreateConfigurableAnnotation();

class ConfigLibs {
  // #region Object Properties

  @ConfigurableProperty({
    applications: {
      [APP_HOME_CONTROLLER.description]: 'available',
    },
    type: {
      reference: CustomLogicConfig,
    },
  })
  public custom?: CustomLogicConfig;
  @ConfigurableProperty({
    applications: {
      [APP_HOME_CONTROLLER.description]: 'available',
    },
    type: {
      reference: ServerConfig,
    },
  })
  public server?: ServerConfig;
  @ConfigurableProperty({
    applications: {
      [APP_HOME_CONTROLLER.description]: 'default',
    },
    type: {
      reference: HomeAssistantConfig,
    },
  })
  public homeassistant?: HomeAssistantConfig;
  @ConfigurableProperty({
    applications: {
      [APP_HOME_CONTROLLER.description]: 'default',
    },
    type: {
      reference: UtilsConfig,
    },
  })
  public utils?: UtilsConfig;
  @ConfigurableProperty({
    applications: {},
    type: {
      reference: AuthenticationConfig,
    },
  })
  public authentication?: AuthenticationConfig;
  @ConfigurableProperty({
    applications: {},
    type: {
      reference: FormioSDKConfig,
    },
  })
  public formiosdk?: FormioSDKConfig;

  // #endregion Object Properties
}

type ApplicationConfigs =
  | HomeControllerApplicationSettingsDTO
  | DevtoolsApplicationSettingsDTO;

/**
 * Top level configuration object
 *
 * Extends the global common config, adding a section for the top level application to chuck in data without affecting things
 * Also provides dedicated sections for libraries to store their own configuration options
 */
export class AutomagicalConfig {
  // #region Object Properties

  /**
   * Custom variables for implementations
   */
  @ConfigurableProperty({
    applications: 'default',
    type: undefined,
  })
  public application?: ApplicationConfigs;
  @ConfigurableProperty({
    applications: 'default',
    type: {
      reference: CommonConfig,
    },
  })
  public common?: CommonConfig;
  /**
   * Libraries
   */
  @ConfigurableProperty({
    applications: 'default',
    type: {
      reference: ConfigLibs,
    },
  })
  public libs?: ConfigLibs;
  /**
   * For debugging purposes, your config will be printed by default
   *
   * After things seem like they're working, set this to false
   */
  @ConfigurableProperty({
    applications: {},
    default: false,
    type: 'boolean',
  })
  public SKIP_CONFIG_PRINT?: boolean;

  // #endregion Object Properties
}
