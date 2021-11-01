import { LIB_TTY } from '@automagical/utilities';
import { LibraryModule } from '@automagical/utilities';
import { DiscoveryModule } from '@nestjs/core';

import {
  ColorsService,
  GitService,
  MainCLIService,
  PromptService,
  ReplExplorerService,
  SystemService,
  TypePromptService,
  WorkspaceService,
} from '../services';

@LibraryModule({
  exports: [
    SystemService,
    TypePromptService,
    PromptService,
    ColorsService,
    WorkspaceService,
    GitService,
  ],
  imports: [DiscoveryModule],
  library: LIB_TTY,
  providers: [
    SystemService,
    TypePromptService,
    PromptService,
    GitService,
    ColorsService,
    ReplExplorerService,
    MainCLIService,
    WorkspaceService,
  ],
})
export class MainCLIModule {}
