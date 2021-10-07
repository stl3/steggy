import {
  RoomControllerFlags,
  RoomControllerSettingsDTO,
} from '@automagical/controller-logic';
import { FetchService, FetchWith, InjectConfig } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';

import { ADMIN_KEY, CONTROLLER_API } from '../../config';

type MenuItem = { name: string; value: RoomControllerSettingsDTO };
const EMPTY = 0;
const UP = 1;
const DOWN = 2;

@Injectable()
export class HomeFetchService {
  constructor(
    private readonly fetchService: FetchService,
    @InjectConfig(ADMIN_KEY) private readonly adminKey: string,
    @InjectConfig(CONTROLLER_API) readonly url: string,
  ) {
    fetchService.BASE_URL = url;
  }

  public fetch<T>(fetch: FetchWith): Promise<T> {
    fetch.adminKey = this.adminKey;
    return this.fetchService.fetch<T>(fetch);
  }
}
