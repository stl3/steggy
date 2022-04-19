import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DBFake {
  /**
   * Autogenerated string
   */
  @IsOptional()
  @IsString()
  public _id?: string;
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
  public created?: string;
  /**
   * Autogenerated last modified date
   */
  @IsOptional()
  @IsDateString()
  @Prop({
    index: true,
  })
  public modified?: string;
}
