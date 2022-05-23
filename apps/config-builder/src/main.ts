import {
  AbstractConfig,
  ConfigDefinitionDTO,
  ConfigTypeDTO,
  InjectConfig,
  iQuickScript,
  QuickScript,
  StringConfig,
  WorkspaceService,
} from '@steggy/boilerplate';
import {
  ApplicationManagerService,
  DONE,
  MainMenuEntry,
  PromptService,
  ScreenService,
  SyncLoggerService,
  ToMenuEntry,
  TTYModule,
} from '@steggy/tty';
import { deepExtend, is, TitleCase } from '@steggy/utilities';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { get, set } from 'object-path';
import { exit } from 'process';

// const NO_VALUE = Symbol();
@QuickScript({
  application: Symbol('config-builder'),
  imports: [TTYModule],
})
export class ConfigScanner implements iQuickScript {
  constructor(
    private readonly logger: SyncLoggerService,
    @InjectConfig('DEFINITION_FILE') private readonly definitionFile: string,
    @InjectConfig('CONFIG_FILE')
    private readonly outputFile: string,
    private readonly workspaceService: WorkspaceService,
    private readonly screenService: ScreenService,
    private readonly promptService: PromptService,
    private readonly applicationManager: ApplicationManagerService,
  ) {}

  private config: AbstractConfig;
  private configDefinition: ConfigDefinitionDTO;
  private dirty = false;

  private get loadedApplication() {
    return this.configDefinition.application;
  }

  public async exec() {
    this.applicationManager.setHeader(
      'App Config',
      TitleCase(this.configDefinition.application),
    );
    const action = await this.promptService.menu({
      hideSearch: true,
      right: ToMenuEntry([
        ['List config files', 'list-files'],
        ['Edit config', 'edit'],
      ]),
    });
    switch (action) {
      case 'list-files':
        this.listConfigFiles();
        await this.promptService.acknowledge();
        return await this.exec();
      case 'edit':
        await this.selectConfig();
        console.log(this.config);
        await this.promptService.acknowledge();
        return await this.exec();
    }
  }

  public onModuleInit() {
    if (is.empty(this.definitionFile)) {
      this.logger.error(`[DEFINITION_FILE] not provided`);
      exit();
    }
    if (!existsSync(this.definitionFile)) {
      this.logger.error(
        `[DEFINITION_FILE] {${this.definitionFile}} does not exist`,
      );
      exit();
    }
    this.configDefinition = JSON.parse(
      readFileSync(this.definitionFile, 'utf8'),
    );

    const [configs] = this.workspaceService.loadMergedConfig(
      this.workspaceService.configFilePaths(this.configDefinition.application),
    );
    const mergedConfig: AbstractConfig = {};
    configs.forEach(config => deepExtend(mergedConfig, config));
    this.config = mergedConfig;
  }

  private async editConfig(config: ConfigTypeDTO): Promise<void> {
    const path = this.path(config);
    const current = get(this.config, path, config?.default);
    let result: unknown;
    switch (config.metadata.type) {
      case 'boolean':
        result = await this.promptService.boolean(
          config.property,
          current as boolean,
        );
        break;
      case 'number':
        result = await this.promptService.number(
          config.property,
          current as number,
        );
        break;
      case 'password':
        result = await this.promptService.password(
          config.property,
          current as string,
        );
        break;
      case 'url':
      case 'string':
        const { metadata } = config as ConfigTypeDTO<StringConfig>;
        result = Array.isArray(metadata.enum)
          ? await this.promptService.pickOne(
              config.property,
              ToMenuEntry(metadata.enum.map(i => [i, i])),
              current,
            )
          : await this.promptService.string(config.property, current as string);
        break;
    }
    // await sleep(5000);
    if (result === config.default || result === current) {
      // Don't set defaults
      return;
    }
    set(this.config, path, result);
    this.dirty = true;
  }

  private listConfigFiles(): void {
    if (is.empty(this.loadedApplication)) {
      this.logger.error(`[APPLICATION] not provided`);
      return;
    }
    const list = this.workspaceService.configFilePaths(this.loadedApplication);
    this.applicationManager.setHeader('Config Files');
    this.screenService.print(
      chalk`Potential configuration files for {blue.bold ${this.loadedApplication}}`,
    );
    list.forEach(item =>
      this.screenService.print(
        chalk`  {${existsSync(item) ? 'green' : 'red'} ${item}}`,
      ),
    );
    this.screenService.print(
      `\nAt runtime, final configuration values are resolved using these priorities:`,
    );
    this.screenService.print(
      chalk` {yellow -} values from developer as defaults`,
    );
    this.screenService.print(
      chalk` {yellow -} values from files (loaded in descending order and merged)`,
    );
    this.screenService.print(
      chalk` {yellow -} values from environment variables`,
    );
    this.screenService.print(
      chalk` {yellow -} values from command line switches`,
    );
  }

  private path(config: ConfigTypeDTO): string {
    if (
      !is.empty(config.library) &&
      config.library !== this.loadedApplication
    ) {
      return `libs.${config.library}.${config.property}`;
    }
    return `application.${config.property}`;
  }

  private async selectConfig(initial?: ConfigTypeDTO): Promise<void> {
    const mergedConfig = this.config;
    const item = await this.promptService.menu({
      keyMap: { d: [chalk.bold`Done`, DONE] },
      right: this.configDefinition.config.map(item => {
        const prefix =
          this.configDefinition.application === item.library
            ? 'application'
            : `libs.${item.library}`;
        let currentValue = get(
          mergedConfig,
          `${prefix}.${item.property}`,
        ) as unknown;
        switch (item.metadata.type) {
          case 'number':
            // currentValue = Number(currentValue);
            break;
          case 'boolean':
            if (is.string(currentValue)) {
              currentValue = ['false', 'n'].includes(
                currentValue.toLowerCase(),
              );
              break;
            }
            currentValue = Boolean(currentValue);
        }
        let helpText = item.metadata.description;
        if (item.metadata.default) {
          const color =
            {
              boolean: 'green',
              internal: 'magenta',
              number: 'yellow',
            }[item.metadata.type] ?? 'white';
          helpText = chalk`{blue Default Value:} {${color} ${item.metadata.default}}\n {cyan.bold > }${helpText}`;
        }
        return {
          entry: [
            chalk`{${
              [item.metadata.default, undefined].includes(currentValue)
                ? 'white'
                : 'green.bold'
            } ${item.property}}`,
            item,
          ],
          helpText,
          type: TitleCase(item.library),
        } as MainMenuEntry<ConfigTypeDTO>;
      }),
      value: initial,
    });
    if (is.string(item)) {
      return;
    }
    await this.editConfig(item);
    return await this.selectConfig(item);
  }
}
