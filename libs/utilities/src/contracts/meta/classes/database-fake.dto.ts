import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { CanFake } from './can-fake.dto';

export class DBFake extends CanFake {
  public static fake(): DBFake {
    return {
      _id: Types.ObjectId().toHexString(),
      created: dayjs().toDate(),
      modified: dayjs().toDate(),
    };
  }

  /**
   * Autogenerated creation date
   */
  @ApiProperty({
    description: 'Autogenerated property',
    readOnly: true,
    title: 'Date of creation',
    type: 'Date',
  })
  @IsOptional()
  @IsDateString()
  @Prop({
    index: true,
  })
  public created?: Date;
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
   * Autogenerated string
   */
  @IsOptional()
  @IsString()
  public _id?: string;
}