import { ProjectDTO } from '@formio/contracts/formio-sdk';
import { SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = ProjectDTO & Document;

export const ProjectSchema = SchemaFactory.createForClass(ProjectDTO);
ProjectSchema.index(
  { machineName: 1 },
  { partialFilterExpression: { deleted: { $eq: null } }, unique: true },
);