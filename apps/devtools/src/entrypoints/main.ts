import { Bootstrap } from '@automagical/boilerplate';
import { MainCLIService } from '@automagical/tty';
import { show } from 'cli-cursor';

import { BOOTSTRAP_OPTIONS } from '../environments/environment';
import { DevtoolsModule } from '../modules';

const FINISH_BOOTSTRAPPING = 10;

BOOTSTRAP_OPTIONS.postInit ??= [];
BOOTSTRAP_OPTIONS.postInit.push(app => {
  const main = app.get(MainCLIService);
  setTimeout(() => {
    main.exec();
  }, FINISH_BOOTSTRAPPING);
});
Bootstrap(DevtoolsModule, BOOTSTRAP_OPTIONS);
process.addListener('beforeExit', () => show());
