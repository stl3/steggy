import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import faker from 'faker';
import { Schema as MongooseSchema } from 'mongoose';

import { DBFake } from '../../classes';
import { MONGO_COLLECTIONS } from '../persistence/mongo';
import { BaseOmitProperties } from '.';
import { TransformObjectId } from './transform-object-id.decorator';

/* eslint-disable security/detect-object-injection */
const NAME_REGEX = '^(?!-)[0-9a-zA-Z-]*(?<!submission|action|-)$';
const NAME_ERROR =
  'May only container numbers, letters, and dashes. Must not terminate with a dash';

@Schema({
  collection: MONGO_COLLECTIONS.forms,
  minimize: false,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'modified',
  },
})
export class FormDTO extends DBFake {
  // #region Public Static Methods

  public static fake(
    mixin: Partial<FormDTO> = {},
    withID = false,
  ): Omit<FormDTO, BaseOmitProperties> {
    return {
      ...(withID ? super.fake() : {}),
      machineName: faker.lorem.slug(3).split('-').join(':'),
      name: faker.lorem.slug(8),
      path: faker.lorem.slug(4),
      title: faker.lorem.word(8),
      type: 'form',
      ...mixin,
    };
  }

  // #endregion Public Static Methods

  // #region Object Properties

  @ApiProperty({
    description:
      'These operate the same on the inside, type is for categorization purposes',
  })
  @Prop({
    default: 'form',
    index: true,
    required: true,
    type: MongooseSchema.Types.String,
  })
  public type?: 'form' | 'resource';
  @ApiProperty({
    description: 'An array of form components to build forms/data models from',
  })
  @IsObject({ each: true })
  @IsOptional()
  @Prop()
  public components?: Record<string, unknown>[];
  @ApiProperty({
    description: 'Date of deletion',
    readOnly: true,
  })
  @IsOptional()
  @IsNumber()
  @Prop({ default: null })
  public deleted?: number;
  @ApiProperty({
    description: 'Developer definable key:value pairs to attach to the form',
  })
  @IsObject()
  @IsOptional()
  @Prop({
    type: MongooseSchema.Types.Mixed,
  })
  public properties?: Record<string, unknown>;
  @IsObject()
  @IsOptional()
  @Prop({
    type: MongooseSchema.Types.Mixed,
  })
  @ApiProperty({
    description: 'This vs properties?',
  })
  public settings?: { allowExistsEndpoint?: boolean } | Record<string, unknown>;
  @IsString()
  @IsOptional()
  @Prop({
    default: null,
    index: true,
    ref: MONGO_COLLECTIONS.projects,
    type: MongooseSchema.Types.ObjectId,
  })
  @ApiProperty({
    description: 'External project reference',
    readOnly: true,
  })
  @TransformObjectId()
  public project?: string;
  @IsString()
  @IsOptional()
  @Prop({
    index: true,
    ref: MONGO_COLLECTIONS.submissions,
  })
  @ApiProperty({
    description:
      'User ID for owner of this entity. See Users collection in Portal Base',
    readOnly: true,
  })
  @TransformObjectId()
  public owner?: string;
  /**
   * A custom action URL to submit the data to.
   */
  @IsString()
  @IsOptional()
  @Prop()
  @ApiProperty({})
  public action?: string;
  @IsString()
  @IsOptional()
  @Prop()
  @ApiProperty({})
  public display?: string;
  @IsString({ each: true })
  @IsOptional()
  @Prop({ index: true })
  @ApiProperty({})
  public tags?: string[];
  @IsString()
  @Matches(NAME_REGEX, '', {
    message: NAME_ERROR,
  })
  @Prop({
    index: true,
    lowercase: true,
    required: true,
    trim: true,
    unique: true,
  })
  @ApiProperty({
    description: NAME_ERROR,
    format: NAME_REGEX,
  })
  public path: string;
  /**
   * Used for generating URL paths
   *
   * http://project.your.domain/{form.name}/submit/...
   */
  @IsString()
  @MaxLength(63)
  @Matches(NAME_REGEX, '', {
    message: NAME_ERROR,
  })
  @Prop({
    required: true,
    unique: true,
  })
  @ApiProperty({
    description: NAME_ERROR,
    format: NAME_REGEX,
    maxLength: 63,
  })
  public name: string;
  @IsString()
  @MaxLength(63)
  @Prop({
    required: true,
  })
  @ApiProperty({
    description: 'Short human understandable string to describe the form',
    maxLength: 63,
  })
  public title: string;
  @IsString()
  @Prop({})
  @ApiProperty({
    description:
      'Globally unique string for indexing. Auto calculates as projectName[:formName[:submissionId]]',
  })
  public machineName: string;

  // #endregion Object Properties
}
