import { AutomagicalConfig } from '@formio/contracts/config';
import { APPLICATION_LIST, LIBRARY_LIST } from '@formio/contracts/constants';
import { NXAffected, NXWorkspaceDTO } from '@formio/contracts/terminal';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { eachSeries } from 'async';
import chalk from 'chalk';
import execa from 'execa';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { decode, encode } from 'ini';
import inquirer from 'inquirer';
import { homedir } from 'os';
import { join } from 'path';
import { cwd } from 'process';
import { inc } from 'semver';
import { MainCLIREPL } from '../repl/main-cli.repl';
import { filterUnique } from '@formio/utilities';

/**
 * Class for working with the host operating system,
 * and performing operations against the workspace
 */
@Injectable()
export class SystemService {
  // #region Object Properties

  public workspace: NXWorkspaceDTO = JSON.parse(
    readFileSync('workspace.json', 'utf-8'),
  );

  private nameMap = new Map<string, string>();
  private packages = new Map<string, Record<'version', string>>();
  private systemConfigs = new Map<string, AutomagicalConfig>();

  // #endregion Object Properties

  // #region Constructors

  constructor(private readonly cli: MainCLIREPL) {}

  // #endregion Constructors

  // #region Public Methods

  public applicationConfigPath(application: string): string {
    return join(homedir(), '.config', application);
  }

  public async bumpApplications(list: string[]): Promise<void> {
    await eachSeries(
      list.filter(
        (item) => this.workspace.projects[item].projectType === 'application',
      ),
      async (application: string, callback) => {
        const { version } = this.packageGet(application);
        const { action } = await inquirer.prompt([
          {
            message: application,
            suffix: `@${version}`,
            type: 'expand',
            name: 'action',
            choices: [
              {
                key: 'm',
                name: 'Minor',
                value: 'minor',
              },
              {
                key: 'p',
                name: 'Patch',
                value: 'patch',
              },
              {
                key: 'r',
                name: 'Release Candidate',
                value: 'rc',
              },
            ],
          },
        ]);
        const updated =
          action === 'rc'
            ? inc(version, 'prerelease', 'rc')
            : inc(version, action);
        console.log(
          chalk.blueBright(application),
          version,
          chalk.green(`=>`),
          updated,
        );
        this.packageWriteVersion(application, updated);
        callback();
      },
    );
  }

  public bumpLibraries(list: string[]): void {
    list
      .filter((item) => this.workspace.projects[item].projectType === 'library')
      .forEach((value) => {
        const data = this.packageGet(value);
        const currentVersion = data.version;
        data.version = inc(data.version, 'patch');
        this.packageWriteVersion(value, data.version);
        console.log(
          chalk`{yellow library} ${value} ${currentVersion} {green =>} ${data.version}`,
        );
      });
  }

  public bumpRootPackageVersion(): string {
    const rootPackage = JSON.parse(readFileSync('package.json', 'utf-8'));
    const current = rootPackage.version;
    rootPackage.version = inc(rootPackage.version, 'patch');
    writeFileSync('package.json', JSON.stringify(rootPackage, undefined, '  '));
    console.log(
      chalk.magenta('root'),
      current,
      chalk.green(`=>`),
      rootPackage.version,
    );
    return rootPackage.version;
  }

  public async getAffected(): Promise<NXAffected> {
    const { stdout } = await execa('npx', ['nx', 'print-affected']);
    return JSON.parse(stdout);
  }

  public async getBranchName(): Promise<string> {
    const { stdout } = await execa('git', [
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ]);
    return stdout;
  }

  public async getCommitMessages(branch: string): Promise<string[]> {
    const { stdout } = await execa('git', [
      'log',
      '--walk-reflogs',
      '--format=%B',
      branch.trim(),
    ]);
    return filterUnique(stdout.split(`\n`).filter((item) => item.length > 0));
  }

  public isLibrary(project: string): boolean {
    if (this.nameMap.has(project)) {
      project = this.nameMap.get(project);
    }
    return this.workspace.projects[project].projectType === 'library';
  }

  public loadConfig(application: string): AutomagicalConfig {
    return this.systemConfigs.get(application) ?? {};
  }

  /**
   * Retrieve package.json using workspace name or app symbol description
   */
  public packageGet(project: string): Record<'version', string> {
    // Map the name to the workspace name
    if (this.nameMap.has(project)) {
      project = this.nameMap.get(project);
    } else {
      if (this.packages.has(project)) {
        return this.packages.get(project);
      }
      const { projects } = this.workspace;
      if (typeof projects[project] === 'undefined') {
        const updated = Object.keys(projects).some((key) => {
          // Match based off of the first 3 characters
          if (key.substr(0, 3) === project.substr(0, 3)) {
            project = key;
            this.nameMap.set(project, key);
            return true;
          }
          return false;
        });
        if (!updated) {
          throw new InternalServerErrorException(`Unknown project: ${project}`);
        }
      }
    }
    const packageFile = join(
      cwd(),
      this.workspace.projects[project].root,
      `package.json`,
    );
    const exists = existsSync(packageFile);
    if (!exists) {
      throw new InternalServerErrorException(
        `Missing package file: ${packageFile}`,
      );
    }
    const data = JSON.parse(readFileSync(packageFile, 'utf-8'));
    this.packages.set(project, data);
    return data;
  }

  public async writeConfig(
    application: string,
    config: AutomagicalConfig,
  ): Promise<void> {
    const file = this.applicationConfigPath(application);
    console.log(chalk.green('path'), file);
    if (
      existsSync(file) &&
      (await this.cli.confirm('Overwrite existing config file?')) === false
    ) {
      return;
    }
    writeFileSync(file, encode(config));
    console.log(chalk.inverse(chalk.green(`${file} written`)));
  }

  // #endregion Public Methods

  // #region Protected Methods

  protected onModuleInit(): void {
    APPLICATION_LIST.forEach((application) => {
      const file = this.applicationConfigPath(application);
      if (existsSync(file)) {
        this.systemConfigs.set(
          application,
          decode(readFileSync(file, 'utf-8')),
        );
      }
      this.packageGet(application);
    });
    LIBRARY_LIST.forEach((library) => this.packageGet(library));
  }

  // #endregion Protected Methods

  // #region Private Methods

  private packageWriteVersion(project: string, version: string): void {
    const packageFile = join(
      cwd(),
      this.workspace.projects[project].root,
      `package.json`,
    );
    const data = this.packages.get(project);
    data.version = version;
    this.packages.set(project, data);
    writeFileSync(packageFile, JSON.stringify(data, undefined, '  '));
  }

  // #endregion Private Methods
}