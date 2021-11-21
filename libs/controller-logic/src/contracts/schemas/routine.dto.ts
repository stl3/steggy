import { TransformObjectId } from '@ccontour/persistence';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Document } from 'mongoose';

import { RoutineActivateDTO } from '../routines';
import { RoutineCommandDTO } from '../routines/routine-command.dto';

export enum ROUTINE_SCOPE {
  public,
  http,
}

@Schema({
  collection: `routines`,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'updated',
  },
})
export class RoutineDTO {
  /**
   * Autogenerated string
   */
  @IsOptional()
  @IsString()
  @TransformObjectId()
  public _id?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Prop()
  public activate?: RoutineActivateDTO[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Prop()
  public command?: RoutineCommandDTO[];

  /**
   * Autogenerated creation date
   */
  @IsOptional()
  @IsDateString()
  @Prop({
    index: true,
  })
  public created?: Date;

  @IsNumber()
  @IsOptional()
  @Prop({ default: null, type: 'number' })
  public deleted?: number;

  @IsString()
  @Prop({ required: true, type: 'string' })
  @Expose()
  public friendlyName: string;

  /**
   * Autogenerated last modified date
   */
  @IsOptional()
  @IsDateString()
  @Prop({
    index: true,
  })
  public modified?: Date;

  /**
   * Room that owns this routine
   */
  @Prop({
    index: true,
  })
  @IsString()
  @TransformObjectId()
  public room: string;
}

export type RountineDocument = RoutineDTO & Document;
export const RoutineSchema = SchemaFactory.createForClass(RoutineDTO);
