import { APP_DEVTOOLS } from '@automagical/contracts/constants';
import { MinimalSdkModule } from '@automagical/formio-sdk';
import { MainCLIModule } from '@automagical/terminal';
import { ApplicationModule, UtilitiesModule } from '@automagical/utilities';

import { YoinkService } from '../services';

@ApplicationModule({
  application: APP_DEVTOOLS,
  imports: [MinimalSdkModule, UtilitiesModule, MainCLIModule],
  providers: [YoinkService],
})
export class DevtoolsModule {}
