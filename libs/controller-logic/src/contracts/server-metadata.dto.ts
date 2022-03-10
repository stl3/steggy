import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TransformObjectId } from '@automagical/persistence';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Document } from 'mongoose';

@Schema({
  collection: `server-metadata`,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'modified',
  },
})
export class ServerMetadataDTO {
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
  @ApiProperty({ required: false })
  @IsDateString()
  @Prop({ index: true })
  public created?: Date;

  @Prop({ type: 'object' })
  public data: Record<string, unknown>;

  @IsNumber()
  @ApiProperty({ required: false })
  @IsOptional()
  @Prop({ default: null, type: 'number' })
  public deleted?: number;

  /**
   * Autogenerated last modified date
   */
  @IsOptional()
  @ApiProperty({ required: false })
  @IsDateString()
  @Prop({ index: true })
  public modified?: Date;

  @IsString()
  @Prop({ index: true })
  public type: string;
}

export type ServerMetadataDocument = ServerMetadataDTO & Document;
export const ServerMetadataSchema =
  SchemaFactory.createForClass(ServerMetadataDTO);