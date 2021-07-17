import { LIB_UTILS } from '@formio/contracts/constants';
import { FormDTO } from '@formio/contracts/formio-sdk';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  ClassDeclaration,
  createPrinter,
  createSourceFile,
  EmitHint,
  NewLineKind,
  ScriptKind,
  ScriptTarget,
  transpileModule,
} from 'typescript';

import { InjectLogger } from '../decorators';
import { DTOBuilderService } from './dto-builder.service';

@Injectable()
export class TypeWriterService {
  // #region Constructors

  constructor(
    @InjectLogger(TypeWriterService, LIB_UTILS)
    private readonly logger: PinoLogger,
    private readonly dtoBuilderService: DTOBuilderService,
  ) {}

  // #endregion Constructors

  // #region Public Methods

  public async dtoFromForm(form: FormDTO, transpile = false): Promise<string> {
    const resources = await this.dtoBuilderService.build(form);

    const printer = createPrinter();
    const source = resources
      .map((resource) =>
        printer.printNode(
          EmitHint.Unspecified,
          resource,
          createSourceFile('out.ts', '', ScriptTarget.ESNext),
        ),
      )
      .join('\n\n');
    if (!transpile) {
      return source;
    }
    return transpileModule(source, {}).outputText;
  }

  public print(resources: ClassDeclaration[]): string[] {
    // Convert a project into an array of types
    const printer = createPrinter({ newLine: NewLineKind.LineFeed });
    const resultFile = createSourceFile(
      undefined,
      undefined,
      ScriptTarget.Latest,
      false,
      ScriptKind.TS,
    );
    return resources.map((resource) =>
      printer.printNode(EmitHint.Unspecified, resource, resultFile),
    );
  }

  // #endregion Public Methods
}