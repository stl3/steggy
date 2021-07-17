import { Prop, Schema } from '@nestjs/mongoose';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import faker from 'faker';
import { Schema as MongooseSchema } from 'mongoose';

import { DBFake } from '../../classes';
import { MONGO_COLLECTIONS } from '../persistence/mongo';
import { BaseOmitProperties } from '.';

@Schema({
  collection: MONGO_COLLECTIONS.roles,
  minimize: false,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'modified',
  },
})
export class RoleDTO extends DBFake {
  // #region Public Static Methods

  public static fake(
    mixin: Partial<RoleDTO> = {},
    withID = false,
  ): Omit<RoleDTO, BaseOmitProperties> {
    return {
      ...(withID ? super.fake() : {}),
      machineName: faker.lorem.slug(3).split('-').join(':'),
      title: faker.lorem.word(8),
      ...mixin,
    };
  }

  // #endregion Public Static Methods

  // #region Object Properties

  @IsBoolean()
  @IsOptional()
  @Prop({ default: false })
  public admin?: boolean;
  @IsBoolean()
  @IsOptional()
  @Prop({ default: false })
  public default?: boolean;
  @IsOptional()
  @IsNumber()
  @Prop({ default: null })
  public deleted?: number;
  @IsString()
  @IsOptional()
  @Prop({ default: '' })
  public description?: string;
  @IsString()
  @IsOptional()
  @Prop()
  public machineName?: string;
  @IsString()
  @Prop({
    index: true,
    ref: MONGO_COLLECTIONS.projects,
    type: MongooseSchema.Types.ObjectId,
  })
  public project?: string;
  @IsString()
  @Prop({
    index: true,
    required: true,
  })
  public title: string;

  // #endregion Object Properties
}