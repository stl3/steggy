import { AutoLogService, FetchService } from '@ccontour/utilities';
import { Injectable } from '@nestjs/common';

import { RoutineCommandWebhookDTO } from '../../contracts';

@Injectable()
export class WebhookService {
  constructor(
    private readonly logger: AutoLogService,
    private readonly fetchService: FetchService,
  ) {}

  public async activate(command: RoutineCommandWebhookDTO): Promise<void> {
    this.logger.debug({ command }, `Sending webhook`);
    await this.fetchService.fetch({
      method: command.method,
      url: command.url,
    });
  }
}
