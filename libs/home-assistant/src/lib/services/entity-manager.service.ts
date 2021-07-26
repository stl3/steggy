import {
  ALL_ENTITIES_UPDATED,
  HA_EVENT_STATE_CHANGE,
  HA_SOCKET_READY,
  LIB_HOME_ASSISTANT,
} from '@automagical/contracts/constants';
import {
  HassEventDTO,
  HassStateDTO,
} from '@automagical/contracts/home-assistant';
import { InjectLogger, Trace } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { Observable, Subscriber } from 'rxjs';

import { HASocketAPIService } from './ha-socket-api.service';

/**
 * Global entity tracking, the source of truth for anything needing to retrieve the current state of anything
 *
 * Keeps a local cache of all observed entities with the most up to date state available.
 * Observables can be retrieved for monitoring a single entity's state.
 */
@Injectable()
export class EntityManagerService {
  // #region Object Properties

  private readonly ENTITIES = new Map<string, HassStateDTO>();
  private readonly OBSERVABLES = new Map<string, Observable<HassStateDTO>>();
  private readonly SUBSCRIBERS = new Map<string, Subscriber<HassStateDTO>>();

  // #endregion Object Properties

  // #region Constructors

  constructor(
    @InjectLogger(EntityManagerService, LIB_HOME_ASSISTANT)
    private readonly logger: PinoLogger,
    private readonly socketService: HASocketAPIService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // #endregion Constructors

  // #region Public Methods

  /**
   * Retrieve an entity's state
   */
  @Trace()
  public getEntity<T extends HassStateDTO = HassStateDTO>(
    entityId: string[],
  ): T[] {
    return entityId.map((id) => this.ENTITIES.get(id) as T);
  }

  /**
   * Retrieve an onbservable that contains an entity's state
   */
  @Trace()
  public getObservable<T extends HassStateDTO = HassStateDTO>(
    entityId: string,
  ): Observable<T> {
    this.createObservable(entityId);
    return this.OBSERVABLES.get(entityId) as Observable<T>;
  }

  @Trace()
  public listEntities(): string[] {
    return [...this.ENTITIES.keys()];
  }

  // #endregion Public Methods

  // #region Protected Methods

  /**
   * Listen in on the ALL_ENTITIES_UPDATED event
   *
   * When that happens, update the local cache information.
   * Aldo does a great job of initial population of the data
   */
  @OnEvent(ALL_ENTITIES_UPDATED)
  protected async onAllEntitiesUpdated(
    allEntities: HassStateDTO[],
  ): Promise<void> {
    allEntities.forEach((entity) => {
      this.createObservable(entity.entity_id);
      const state = this.ENTITIES.get(entity.entity_id);
      if (state?.last_changed === entity.last_changed) {
        return;
      }
      this.ENTITIES.set(entity.entity_id, entity);
      const subscriber = this.SUBSCRIBERS.get(entity.entity_id);
      subscriber?.next(entity);
    });
  }

  /**
   * Listen in on the HA_EVENT_STATE_CHANGE event
   *
   * This happens any time any entity has an update.
   * Global collection of updates
   */
  @OnEvent(HA_EVENT_STATE_CHANGE)
  protected async onUpdate(event: HassEventDTO): Promise<void> {
    const { entity_id, new_state } = event.data;
    this.createObservable(entity_id);
    this.ENTITIES.set(entity_id, new_state);
    const subscriber = this.SUBSCRIBERS.get(entity_id);
    subscriber?.next(new_state);
    this.eventEmitter.emit(`${entity_id}/update`, event);
  }

  @OnEvent(HA_SOCKET_READY)
  protected async socketReady(): Promise<void> {
    await this.socketService.getAllEntitities();
  }

  // #endregion Protected Methods

  // #region Private Methods

  private createObservable(entityId: string): void {
    if (this.ENTITIES.has(entityId)) {
      return;
    }
    const observable = new Observable<HassStateDTO>((subscriber) => {
      this.SUBSCRIBERS.set(entityId, subscriber);
    });
    this.OBSERVABLES.set(entityId, observable);
  }

  // #endregion Private Methods
}
