import { Injectable } from '@nestjs/common';
import { AutoLogService } from '@text-based/boilerplate';
import { EntityManagerService } from '@text-based/home-assistant';
import { is } from '@text-based/utilities';
import { get } from 'object-path';

import { EntityAttributeDTO } from '../contracts';

@Injectable()
export class EntityAttributeService {
  constructor(
    private readonly logger: AutoLogService,
    private readonly manager: EntityManagerService,
  ) {}

  public async test(comparison: EntityAttributeDTO): Promise<boolean> {
    const entity = await this.manager.getEntity(comparison.entity_id);
    if (!entity) {
      this.logger.error(`Could not look up entity {${comparison.entity_id}}`);
      return false;
    }
    if (!is.undefined(comparison.state)) {
      const out = entity.state === comparison.state;
      if (is.undefined(comparison.attribute)) {
        return out;
      }
      if (out === false) {
        return false;
      }
    }
    const attribute = get(entity.attributes, comparison.attribute);
    return attribute === comparison.value;
  }
}