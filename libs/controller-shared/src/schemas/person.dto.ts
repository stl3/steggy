import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HassStateDTO } from '@steggy/home-assistant-shared';
import { TransformObjectId } from '@steggy/persistence';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { RoomMetadataDTO } from '../meta';
import { PinnedItemDTO } from '../pinned-item.dto';
import { RoomStateDTO } from '../rooms';
import { RoomEntityDTO } from './room.dto';

@Schema({
  collection: `people`,
  timestamps: { createdAt: 'created', updatedAt: 'updated' },
})
export class PersonDTO {
  /**
   * Autogenerated string
   */
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  @TransformObjectId()
  public _id?: string;

  /**
   * Autogenerated creation date
   */
  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  @Prop({ index: true })
  public created?: Date;

  @IsNumber()
  @IsOptional()
  @Prop({ default: null, type: 'number' })
  @ApiProperty({ required: false })
  public deleted?: number;

  @Expose()
  @ApiProperty({ required: false, type: [RoomEntityDTO] })
  @Prop()
  @IsString({ each: true })
  public entities?: RoomEntityDTO[];

  @Expose()
  @ApiProperty({ required: false, type: [RoomEntityDTO] })
  @IsOptional()
  /**
   * Dynamic data, current state for all items in entities array
   */
  public entityStates?: HassStateDTO[];

  @IsString()
  @Prop({ required: true, type: 'string' })
  @ApiProperty()
  public friendlyName: string;

  /**
   * Reference to group entries
   */
  @IsOptional()
  @Prop({ type: [String] })
  @IsString({ each: true })
  @ApiProperty({ required: false })
  @Expose()
  public groups?: string[];

  @IsOptional()
  @Prop({ type: MongooseSchema.Types.Mixed })
  @ValidateNested({ each: true })
  @Expose()
  public metadata?: RoomMetadataDTO[];

  /**
   * Autogenerated last modified date
   */
  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  @Prop({ index: true })
  public modified?: Date;

  /**
   * Javascript referenceable name for VMService
   */
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  @Prop()
  public name?: string;

  /**
   * For UI purposes. Track frequently accessed items
   */
  @IsOptional()
  @Prop()
  @ApiProperty({ required: false })
  @ValidateNested({ each: true })
  public pinned_items?: PinnedItemDTO[];

  /**
   * Reference to room entries
   */
  @IsOptional()
  @Prop({ type: [String] })
  @IsString({ each: true })
  @ApiProperty({ required: false })
  @Expose()
  public rooms?: string[];

  @IsOptional()
  @ApiProperty({ required: false, type: [RoomStateDTO] })
  @ValidateNested()
  @Prop()
  public save_states?: RoomStateDTO[];
}

export type PersonDocument = PersonDTO & Document;
export const PersonSchema = SchemaFactory.createForClass(PersonDTO);
PersonSchema.index({ deleted: 1 });
PersonSchema.index({ deleted: 1, friendlyName: 1 });
