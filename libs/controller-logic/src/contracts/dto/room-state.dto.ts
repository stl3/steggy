import { TransformObjectId } from '@automagical/persistence';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Document } from 'mongoose';

export enum LIGHTING_MODE {
  circadian = 'circadian',
  none = 'none',
}
export class PersistenceSwitchStateDTO {
  @Prop({ required: true, type: String })
  entity_id: string;
  @Prop({ enum: ['on', 'off'], required: true, type: String })
  state: 'on' | 'off';
}

export class PersistenceLightStateDTO extends PersistenceSwitchStateDTO {
  @Prop(Number)
  temperature?: number;
  @Prop([Number])
  rgb?: [number, number, number];
  @Prop(Number)
  brightness?: number;
  @Prop({
    default: LIGHTING_MODE.none,
    enum: Object.values(LIGHTING_MODE),
    required: true,
  })
  mode: LIGHTING_MODE;
}

@Schema()
export class RoomStateDTO {
  @Prop({ default: [], required: true })
  public states: PersistenceSwitchStateDTO[];
  @Prop({ required: true, type: String })
  public name: string;
  @IsNumber()
  @IsOptional()
  @Prop({})
  public deleted?: number;
  /**
   * Autogenerated string
   */
  @IsOptional()
  @IsString()
  @TransformObjectId()
  public _id?: string;
}
export type RoomStateDocument = RoomStateDTO & Document;
export const RoomStateSchema = SchemaFactory.createForClass(RoomStateDTO);
