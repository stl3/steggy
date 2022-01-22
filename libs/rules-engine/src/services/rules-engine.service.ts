import { Injectable } from '@nestjs/common';
import { AutoLogService } from '@text-based/boilerplate';

import { CustomCodeService } from './custom-code.service';
import { TimeRangeService } from './time-range.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class RulesEngineService {
  constructor(
    private readonly logger: AutoLogService,
    private readonly customCode: CustomCodeService,
    private readonly timeRange: TimeRangeService,
    private readonly webhookService: WebhookService,
  ) {}
}