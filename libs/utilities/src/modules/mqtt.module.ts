import { LIB_UTILS } from '@automagical/contracts';
import { ACTIVE_APPLICATION } from '@automagical/contracts/config';
import {
  MQTT_CLIENT_INSTANCE,
  MQTT_HEALTH_CHECK,
} from '@automagical/contracts/utilities';
import { DiscoveryModule } from '@nestjs/core';
import { connect } from 'mqtt';

import { CONFIG, MQTT_HOST, MQTT_PORT } from '../config';
import { LibraryModule } from '../decorators/library-module.decorator';
import {
  AutoConfigService,
  MQTTExplorerService,
  MqttService,
} from '../services';

@LibraryModule({
  config: CONFIG,
  exports: [MqttService, MQTT_CLIENT_INSTANCE],
  imports: [DiscoveryModule],
  library: LIB_UTILS,
  providers: [
    {
      inject: [AutoConfigService, ACTIVE_APPLICATION],
      provide: MQTT_CLIENT_INSTANCE,
      useFactory: (configService: AutoConfigService, application: symbol) => {
        const client = connect({
          host: configService.get([LIB_UTILS, MQTT_HOST]),
          port: Number(configService.get([LIB_UTILS, MQTT_PORT])),
        });
        setInterval(() => {
          if (!client.connected) {
            return;
          }
          client.publish(MQTT_HEALTH_CHECK, application.description);
        }, 1000);
        return client;
      },
    },
    MQTTExplorerService,
    MqttService,
  ],
})
export class MQTTModule {}
