import { CacheManagerService, InjectCache } from '@automagical/boilerplate';
import { DOWN, is, UP, VALUE } from '@automagical/utilities';
import { Inject, Optional } from '@nestjs/common';
import { CONFIG_APPLICATION_TITLE } from '../config';

import { iRepl, MainMenuEntry, MenuEntry, ReplOptions } from '../contracts';
import { Repl } from '../decorators';
import { ReplExplorerService } from './explorers';
import { ApplicationManagerService } from './meta';
import { PinnedItemDTO, PinnedItemService } from './pinned-item.service';
import { PromptEntry, PromptService } from './prompt.service';

// Filter out non-sortable characters (like emoji)
const unsortable = new RegExp('[^A-Za-z0-9_ -]', 'g');
const CACHE_KEY = 'MAIN-CLI:LAST_LABEL';
type ENTRY_TYPE = string | PinnedItemDTO;

@Repl({
  category: 'main',
  name: 'Main',
})
export class MainCLIService implements iRepl {
  constructor(
    private readonly applicationManager: ApplicationManagerService,
    private readonly explorer: ReplExplorerService,
    private readonly promptService: PromptService,
    private readonly pinnedItem: PinnedItemService,
    @InjectCache()
    private readonly cacheService: CacheManagerService,
    @Optional()
    @Inject(CONFIG_APPLICATION_TITLE)
    private readonly applicationTitle = 'Script List',
  ) {}
  private last: ENTRY_TYPE;

  public async exec(): Promise<void> {
    this.applicationManager.setHeader(this.applicationTitle);
    const name = await this.pickOne();
    if (!is.string(name)) {
      await this.pinnedItem.exec(name as PinnedItemDTO);
      return this.exec();
    }
    let instance: iRepl;
    this.explorer.REGISTERED_APPS.forEach((i, options) => {
      if (options.name === name) {
        instance = i;
      }
    });
    await instance.exec();
    await this.exec();
  }

  protected async onModuleInit(): Promise<void> {
    this.last = await this.cacheService.get(CACHE_KEY);
  }

  private getLeft() {
    const entries = this.pinnedItem.getEntries();
    return entries.map(i => ({
      entry: i,
      type: (i[VALUE] as PinnedItemDTO).script,
    })) as MainMenuEntry<ENTRY_TYPE>[];
  }

  private getRight(types: Record<string, PromptEntry<ENTRY_TYPE>[]>) {
    const right: MainMenuEntry<ENTRY_TYPE>[] = [];
    Object.keys(types).forEach(type => {
      types[type]
        .sort((a, b) => {
          if (!Array.isArray(a) || !Array.isArray(b)) {
            return DOWN;
          }
          const a1 = String(a[VALUE]).replace(unsortable, '');
          const b1 = String(b[VALUE]).replace(unsortable, '');
          if (a1 > b1) {
            return UP;
          }
          return DOWN;
        })
        .forEach(i => {
          right.push({
            entry: i as MenuEntry,
            type: type,
          });
        });
    });
    return right;
  }

  private async pickOne(): Promise<ENTRY_TYPE> {
    const types: Record<string, PromptEntry<ENTRY_TYPE>[]> = {};
    const keyMap = {};
    this.explorer.REGISTERED_APPS.forEach(
      (
        instance: iRepl,
        { category: type, name, icon, keybind, keyOnly }: ReplOptions,
      ) => {
        if (name !== 'Main') {
          if (keybind) {
            keyMap[keybind] = [`${icon ?? ''}${name}`, name];
            if (keyOnly) {
              return;
            }
          }
          types[type] ??= [];
          types[type].push([`${icon ?? ''}${name}`, name]);
        }
      },
    );
    const right = this.getRight(types);
    const left = this.getLeft();
    if (is.object(this.last) && this.last !== null) {
      this.last = left.find(i => {
        return (
          (i.entry[VALUE] as PinnedItemDTO).id ===
          (this.last as PinnedItemDTO).id
        );
      })?.entry[VALUE];
    }
    const result = await this.promptService.menu<ENTRY_TYPE>({
      keyMap,
      left,
      leftHeader: 'Pinned Items',
      right,
      titleTypes: true,
      value: this.last,
    });
    this.last = result;
    await this.cacheService.set(CACHE_KEY, result);
    return result;
  }
}