import { Injectable } from '@nestjs/common';
import { AutoLogService, ModuleScannerService } from '@text-based/utilities';

import {
  COMPONENT_CONFIG,
  ComponentOptions,
  iComponent,
} from '../../decorators';

@Injectable()
export class ComponentExplorerService {
  constructor(
    private readonly scanner: ModuleScannerService,
    private readonly logger: AutoLogService,
  ) {}

  public readonly REGISTERED_EDITORS = new Map<ComponentOptions, iComponent>();

  public findServiceByType<CONFIG, VALUE>(
    name: string,
  ): iComponent<CONFIG, VALUE> {
    let out: iComponent<CONFIG, VALUE>;
    this.REGISTERED_EDITORS.forEach(
      (service: iComponent<CONFIG, VALUE>, settings) => {
        if (settings.type === name) {
          out = service;
        }
      },
    );
    return out;
  }

  public findSettingsBytype(type: string): ComponentOptions {
    let out: ComponentOptions;
    this.REGISTERED_EDITORS.forEach((__, settings) => {
      if (settings.type === type) {
        out = settings;
      }
    });
    return out;
  }

  protected onModuleInit(): void {
    const providers = this.scanner.findWithSymbol<ComponentOptions, iComponent>(
      COMPONENT_CONFIG,
    );
    providers.forEach((key, value) => {
      this.REGISTERED_EDITORS.set(key, value);
    });
    this.logger.info(`[Editors] Initialized`);
  }
}
