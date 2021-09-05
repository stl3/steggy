import {
  ConfigLibraryVisibility,
  ConfigType,
  DefaultConfigOptions,
  LoadConfigDefinition,
} from '@automagical/contracts';
import {
  AutomagicalConfig,
  CONFIGURABLE_LIBS,
  OUTPUT_HEADER_FONT,
} from '@automagical/contracts/config';
import { iRepl } from '@automagical/contracts/tty';
import { AutoConfigService, Trace } from '@automagical/utilities';
import { NotImplementedException } from '@nestjs/common';
import { eachSeries } from 'async';
import chalk from 'chalk';
import { ClassConstructor } from 'class-transformer';
import clear from 'clear';
import Table from 'cli-table';
import figlet from 'figlet';
import ini from 'ini';
import inquirer from 'inquirer';
import { set } from 'object-path';
import rc from 'rc';

import { Repl } from '../decorators';
import { ConfigScannerService } from '../services';
import { SystemService } from '../services/system.service';
import { TypePromptService } from '../services/type-prompt.service';

const LEVEL_MAP = {
  Available: 'available',
  Required: 'required',
} as Record<string, ConfigLibraryVisibility>;
const LEVEL_PRIORITIES: ConfigLibraryVisibility[] = Object.values(
  ConfigLibraryVisibility,
);
type KeyedConfig<T extends ConfigType = ConfigType> =
  DefaultConfigOptions<T> & {
    key: string;
  };

@Repl({
  consumesConfig: [OUTPUT_HEADER_FONT],
  description: [
    `Generate application customized configurations using the latest config definitions.`,
    ``,
    `When complete, you will have the ability to:`,
    `  - Print to screen`,
    `  - Save to file`,
  ],
  name: 'Config Builder',
})
export class ConfigBuilderService implements iRepl {
  // #region Static Properties

  public static AVAILABLE_APPLICATIONS: Map<string, ClassConstructor<unknown>>;

  // #endregion Static Properties

  // #region Object Properties

  private systemConfigs = new Map<string, AutomagicalConfig>();

  // #endregion Object Properties

  // #region Constructors

  constructor(
    private readonly systemService: SystemService,
    private readonly typePrompt: TypePromptService,
    private readonly configService: AutoConfigService,
    private readonly configScanner: ConfigScannerService,
  ) {}

  // #endregion Constructors

  // #region Public Methods

  @Trace()
  public async assembleConfig(
    application: string,
    level: keyof typeof LEVEL_MAP,
  ): Promise<AutomagicalConfig> {
    const appConfig = await this.buildApplicationConfig(application);
    const configOptions = this.buildConfig(application, LEVEL_MAP[level]);
    const config: AutomagicalConfig = {
      application: appConfig,
    };
    if (configOptions.length > 0) {
      console.log(chalk.bold.blue(`Libraries Config`));
      this.configTable(application, configOptions);
    }
    await eachSeries(configOptions, async (item, callback) => {
      const results = await this.typePrompt.prompt(item);
      const path = item.library === '-' ? item.key : `${item.key}`;
      if (results.value === this.configService.getDefault(item.key)) {
        return callback();
      }
      set(config, path, results.value);
      callback();
    });
    return config;
  }

  /**
   * Build the data for the application portion of the config
   */
  @Trace()
  public async buildApplicationConfig(
    application: string,
  ): Promise<Record<string, unknown>> {
    const out = {};
    if (!ConfigBuilderService.AVAILABLE_APPLICATIONS.has(application)) {
      return out;
    }
    const nested = this.loadConfig(
      ConfigBuilderService.AVAILABLE_APPLICATIONS.get(application),
      `application.`,
    );
    if (nested.length > 0) {
      console.log(chalk`{bgBlue.whiteBright Application Config}`);
      this.configTable(application, nested);
    }
    const output = {};
    await eachSeries(nested, async (item, callback) => {
      const results = await this.typePrompt.prompt(
        {
          ...item,
          key: `application.${item.key}`,
        },
        application,
      );
      set(output, item.key, results.value);
      callback();
    });
    return output;
  }

  /**
   * Generic entrypoint for interface
   *
   * - Prompts user for library + priority
   * - Assembles a config
   * - Passes off to handler
   */
  @Trace()
  public async exec(): Promise<void> {
    const { application, level } = (await inquirer.prompt([
      {
        choices: [...ConfigBuilderService.AVAILABLE_APPLICATIONS.keys()],
        message: 'Config Type',
        name: 'application',
        type: 'list',
      },
      {
        choices: Object.keys(LEVEL_MAP).sort((a, b) => {
          if (
            LEVEL_PRIORITIES.indexOf(LEVEL_MAP[a]) >
            LEVEL_PRIORITIES.indexOf(LEVEL_MAP[b])
          ) {
            return 1;
          }
          return -1;
        }),
        message: 'Show options',
        name: 'level',
        type: 'list',
      },
    ])) as { application: string; level: keyof typeof LEVEL_MAP };
    clear();
    this.typePrompt.config = rc(application);

    // const message = encode(this.typePrompt.config).split(`\n`);
    // message.unshift(``);
    // let maxLength = 0;
    // message.forEach(
    //   (line) => (maxLength = line.length > maxLength ? line.length : maxLength),
    // );
    // console.log(
    //   message
    //     .map((line) =>
    //       chalk.bgBlue.white.bold(
    //         line.padEnd(maxLength + 2).padStart(maxLength + 4),
    //       ),
    //     )
    //     .join(`\n`),
    // );

    const config = await this.assembleConfig(application, level);
    await this.handleConfig(config, application);
  }

  /**
   * Prompt the user for what to do
   */
  @Trace()
  public async handleConfig(
    config: AutomagicalConfig,
    application: string,
  ): Promise<void> {
    const result = (await inquirer.prompt([
      {
        choices: [
          {
            key: 'p',
            name: 'Print',
            value: 'print',
          },
          {
            key: 'd',
            name: 'Create Deployment',
            value: 'deploy',
          },
          {
            key: 's',
            name: 'Save',
            value: 'save',
          },
          new inquirer.Separator(),
          {
            key: 'x',
            name: 'Done',
            value: '',
          },
        ],
        message: 'What to do with config?',
        name: 'next',
        type: 'expand',
      },
    ])) as { next: '' | 'deploy' | 'print' | 'save' };

    switch (result.next) {
      case 'print':
        clear();
        console.log(`\n`);
        console.log(
          chalk.yellow(
            figlet.textSync('Completed Config', {
              font: this.configService.get<figlet.Fonts>(OUTPUT_HEADER_FONT),
            }),
          ),
        );
        console.log(ini.encode(config));
        return await this.handleConfig(config, application);
      case 'save':
        await this.systemService.writeConfig(application, config);
        return await this.handleConfig(config, application);

      case 'deploy':
        throw new NotImplementedException();
    }
  }

  // #endregion Public Methods

  // #region Private Methods

  /**
   * Go through CommonConfig & all library configs to generate list of
   * advertised options for a given application.
   *
   * Output list is sorted by `priority` > `library` > `key`
   */
  @Trace()
  private buildConfig(
    application: string,
    level: ConfigLibraryVisibility,
  ): KeyedConfig[] {
    const out: KeyedConfig[] = [];

    CONFIGURABLE_LIBS.forEach(
      (value: ClassConstructor<unknown>, key: string) => {
        const config = this.loadConfig(value, `libs.`).map((item) => {
          item.library = key;
          return item;
        });
        out.push(...config);
      },
    );

    return this.configFilterSort(
      out,
      application,
      LEVEL_PRIORITIES.indexOf(level),
    );
  }

  @Trace()
  private configFilterSort(
    config: KeyedConfig[],
    application: string,
    lte: number,
  ): KeyedConfig[] {
    return config
      .filter((item) => {
        if (!item.applications) {
          return false;
        }
        if (Object.keys(item.applications).length === 0) {
          return false;
        }
        const priority = LEVEL_PRIORITIES.indexOf(
          item.applications[application] ?? item.applications,
        );
        if (priority === -1) {
          return false;
        }
        return lte >= priority;
      })
      .sort((a, b) => {
        const priorityA = LEVEL_PRIORITIES.indexOf(
          a.applications[application] ?? a.applications,
        );
        const priorityB = LEVEL_PRIORITIES.indexOf(
          b.applications[application] ?? b.applications,
        );
        if (priorityA === priorityB) {
          if (a.library === b.library) {
            if (a.key > b.key) {
              return 1;
            }
            return -1;
          }
          if (a.library > b.library) {
            return 1;
          }
          return -1;
        }
        if (priorityA > priorityB) {
          return 1;
        }
        return -1;
      });
  }

  /**
   * Render a table showing all the advertised configuration options for an application.
   * Filter visiblity by level.
   *
   * Priority column is colored
   */
  private configTable(application: string, config: KeyedConfig[]): void {
    const table = new Table({
      head: ['Type', 'Library', 'Name', 'Type', 'Default'],
    });
    config.forEach((configOptions) => {
      table.push([
        this.typeTag(
          typeof configOptions.applications === 'string'
            ? configOptions.applications
            : configOptions.applications[application],
        ),
        configOptions.library ?? '',
        chalk.bold(configOptions.key),
        configOptions.type,
        (configOptions.default ?? '').toString(),
      ]);
    });
    console.log(table.toString());
  }

  private loadConfig(
    reference: ClassConstructor<unknown>,
    prefix: string,
  ): KeyedConfig[] {
    const out = [];
    const prompts = LoadConfigDefinition(reference.name);
    if (!prompts) {
      return out;
    }
    const keys = [...prompts.keys()];
    keys.forEach((key) => {
      const library = prompts.get(key).library;
      out.push({
        ...prompts.get(key),
        key: `${prefix}${library ? `${library}.` : ''}${key}`,
      });
    });
    return out;
  }

  private typeTag(type: keyof typeof ConfigLibraryVisibility) {
    switch (type) {
      case 'available':
        return chalk.bgWhite(chalk.black('available'));
      case 'required':
        return chalk.inverse(chalk.red('required'));
    }
  }

  // #endregion Private Methods
}
