import { DiscoveryModule } from '@nestjs/core';
import { LibraryModule, RegisterCache } from '@steggy/boilerplate';

import {
  DEFAULT_HEADER_FONT,
  HEADER_COLOR,
  HELP,
  LIB_TTY,
  PAGE_SIZE,
  SECONDARY_HEADER_FONT,
} from '../config';
import {
  AcknowledgeComponentService,
  ApplicationManagerService,
  ChartingService,
  ColorsService,
  ComparisonToolsService,
  ComponentExplorerService,
  ConfirmComponentService,
  DateEditorService,
  EditorExplorerService,
  EnvironmentService,
  FooterEditorService,
  GitService,
  KeyboardManagerService,
  KeymapService,
  LayoutManagerService,
  ListBuilderComponentService,
  MenuComponentService,
  NumberEditorService,
  PromptService,
  ScreenService,
  StackService,
  StringEditorService,
  SyncLoggerService,
  SystemService,
  TableBuilderComponentService,
  TableService,
  TerminalHelpService,
  TextRenderingService,
} from '../services';

@LibraryModule({
  configuration: {
    [DEFAULT_HEADER_FONT]: {
      default: 'ANSI Regular',
      description: 'Figlet font',
      type: 'string',
    },
    [HEADER_COLOR]: {
      default: 'bgBlue.black',
      description:
        'Color for primary header text + dividing line. Color must make sense to chalk',
      type: 'string',
    },
    [HELP]: {
      default: false,
      description: 'Intended for consumption as cli switch (--help)',
      type: 'boolean',
    },
    [PAGE_SIZE]: {
      default: 20,
      description: 'Maximum number of items displayed in pickMany prompts',
      type: 'number',
    },
    [SECONDARY_HEADER_FONT]: {
      default: 'Pagga',
      description: 'Figlet font',
      type: 'string',
    },
  },
  exports: [
    ApplicationManagerService,
    ChartingService,
    ColorsService,
    ComparisonToolsService,
    EnvironmentService,
    GitService,
    KeymapService,
    LayoutManagerService,
    PromptService,
    ScreenService,
    StackService,
    SyncLoggerService,
    SystemService,
    TableService,
    TextRenderingService,
  ],
  imports: [DiscoveryModule, RegisterCache()],
  library: LIB_TTY,
  providers: [
    AcknowledgeComponentService,
    ApplicationManagerService,
    ChartingService,
    ColorsService,
    ComparisonToolsService,
    ComponentExplorerService,
    DateEditorService,
    EditorExplorerService,
    ConfirmComponentService,
    EnvironmentService,
    FooterEditorService,
    GitService,
    KeyboardManagerService,
    KeymapService,
    LayoutManagerService,
    ListBuilderComponentService,
    TerminalHelpService,
    MenuComponentService,
    NumberEditorService,
    PromptService,
    ScreenService,
    StackService,
    StringEditorService,
    SyncLoggerService,
    SystemService,
    TableBuilderComponentService,
    TableService,
    TextRenderingService,
  ],
})
export class TTYModule {}
