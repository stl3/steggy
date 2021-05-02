import { LIB_TYPE_WRITER } from '@automagical/contracts/constants';
import { FormioSdkService } from '@automagical/formio-sdk';
import { InjectLogger, Trace } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  // FIXME: For some reason, being normal with imports wasn't working
  createPrinter,
  createSourceFile,
  EmitHint,
  factory,
  Identifier,
  NewLineKind,
  PropertySignature,
  ScriptKind,
  ScriptTarget,
  StringLiteral,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeLiteralNode,
  TypeNode,
} from 'typescript';

type LabelValue = Record<'label' | 'value', string>;

/**
 * #1 DEV TOOL FOR THIS FILE
 * -- https://ts-ast-viewer.com/#code/KYDwDg9gTgLgBDAnmYcBiEJwLxwEQBCAhlHnAD77EB2RteQA
 */

/**
 * Properties that affect the type definition
 *
 * Custom components might have logic not accounted for here
 */
export interface Component {
  // #region Object Properties

  columns?: Component[];
  components?: Component[];
  data?: {
    url?: string;
    headers?: Record<'key' | 'value', string>[];
    values?: LabelValue[];
    json?: string;
  };
  dataSrc?: 'json' | 'url';
  dataType?: 'auto' | 'string' | 'object' | 'string' | 'number';
  input: boolean;
  key: string;
  multiple?: boolean;
  protected?: boolean;
  questions?: LabelValue[];
  rows?: { components: Component[] }[][];
  storeas?: 'array' | 'string';
  // types that have specific callouts, not all supported types
  type: 'signature' | 'container' | 'datamap' | 'datagrid' | 'tree';
  validate?: { required: boolean };
  valueProperty?: string;
  values?: LabelValue[];

  // #endregion Object Properties
}

export type property = {
  key: string;
  optional?: boolean;
  type?: TypeNode;
  union?: string[];
  array?: boolean;
};

type Context = Partial<{
  declarationList: Map<string, TypeAliasDeclaration>;
  baseName: string;
  waitingForIdentifiers: Map<string, ((value?: unknown) => unknown)[]>;
  identifiers: Map<string, Identifier>;
}>;

export interface indexProject {
  // #region Object Properties

  components: Component[];
  name: string;
  title: string;

  // #endregion Object Properties
}

/**
 * I mean... it doesn't have to write I guess
 *
 * Tooling for automatic building of type definitions from a project / resource
 */
@Injectable()
export class TypeWriterService {
  // #region Static Properties

  public static DEFINITION_KEYWORD = 'Definition';
  public static RECURSIVE_KEYWORD = 'Recursive';

  // #endregion Static Properties

  // #region Object Properties

  private context: Context;
  private lock = false;

  // #endregion Object Properties

  // #region Constructors

  constructor(
    @InjectLogger(TypeWriterService, LIB_TYPE_WRITER)
    protected readonly logger: PinoLogger,
    private readonly formioSdkService: FormioSdkService,
  ) {}

  // #endregion Constructors

  // #region Private Accessors

  private get boolean() {
    return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword);
  }

  private get string() {
    return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
  }

  private get unknown() {
    return factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword);
  }

  // #endregion Private Accessors

  // #region Public Methods

  /**
   * Take in a project (or stage), run through the forms & resources generating types for each
   * Return back array of AST type declarations
   *
   * 💥 Don't do simultanious calls to build using the same instance of this service 💥
   */
  public async build(form: indexProject): Promise<TypeAliasDeclaration[]> {
    if (this.lock) {
      // It's more work to pass contexts around
      throw new Error('Cannot do simultanious builds');
    }
    // recursive components like trees inject declarations
    this.lock = true;
    this.reset();
    const name = form.name;
    this.context.baseName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    this.logger.info(`Creating type ${name}: ${form.title}`);
    await this.addDeclaration(
      this.context.baseName,
      factory.createTypeLiteralNode([
        // The everything not from components
        // _id, owner, etc
        ...this.getApiProperties(),

        // Components
        await this.createProperty(
          'data',
          factory.createTypeLiteralNode(
            await this.toProperties(form.components),
          ),
        ),
      ]),
    );

    this.lock = false;
    return Object.values(this.context.declarationList);
  }

  /**
   * Build types for an array of projects
   * return back
   */
  public async print(project: indexProject): Promise<string[]> {
    // Convert a project into an array of types
    const printer = createPrinter({ newLine: NewLineKind.LineFeed });
    const resultFile = createSourceFile(
      undefined,
      undefined,
      ScriptTarget.Latest,
      false,
      ScriptKind.TS,
    );

    return (await this.build(project)).map((resource) =>
      printer.printNode(EmitHint.Unspecified, resource, resultFile),
    );
  }

  // #endregion Public Methods

  // #region Private Methods

  /**
   * Pull json from a url
   */
  @Trace()
  private async valuesFromUrl(component: Component) {
    // TODO: Determine if any substitutions need to happen
    const headers = {};
    component.data.headers.forEach((header) => {
      if (header.key) {
        headers[header.key] = header.value;
      }
    });
    return await this.formioSdkService.fetch<Record<string, unknown>[]>({
      headers,
      rawUrl: true,
      url: component.data.url,
    });
  }

  private async addDeclaration(
    name: string,
    body: TypeLiteralNode,
    exportDeclaration = true,
  ) {
    const declaration = factory.createTypeAliasDeclaration(
      // TODO: Decorators
      // As far as I can tell, this and the 3rd param exists to be API consistent
      undefined,
      exportDeclaration
        ? [factory.createModifier(SyntaxKind.ExportKeyword)]
        : [],
      await this.getIdentifier(name),

      // Type parameters
      undefined,

      // The body of the type definition
      body,
    );
    this.context.declarationList.set(name, declaration);
  }

  /**
   * key: value
   *
   * key?: value
   */
  private async createProperty(key: string, value: TypeNode, optional = true) {
    return factory.createPropertySignature(
      undefined,
      await this.getIdentifier(key),
      optional ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
      value,
    );
  }

  private async extractGroups(
    component: Component,
  ): Promise<PropertySignature[]> {
    // Basic layout
    const children = component.columns || component.components;
    if (children) {
      if (['container', 'datagrid', 'tree'].includes(component.type)) {
        component.input = false;
        // key: { ...components }
        let literal: TypeNode = factory.createTypeLiteralNode(
          await this.toProperties(children),
        );

        switch (component.type) {
          case 'tree':
            literal = await this.treeBuilder(
              literal as TypeLiteralNode,
              component,
            );
            break;
          case 'datagrid':
            literal = factory.createArrayTypeNode(literal);
            break;
        }

        return [await this.createProperty(component.key, literal)];
      }
      // recurse and flatten
      return this.toProperties(children);
    }

    // Table
    if (component.rows) {
      // Fun with prettier 📈
      return this.flatten(
        this.flatten(
          await Promise.all(
            component.rows.map((row) =>
              Promise.all(
                row.map((cell) => this.toProperties(cell.components)),
              ),
            ),
          ),
        ),
      );
    }

    return undefined;
  }

  /**
   * something[][] => something[]
   */
  private flatten<T>(array: T[][]): T[] {
    // eslint-disable-next-line unicorn/no-array-reduce
    return array.reduce((accumulator, value) => {
      // eslint-disable-next-line unicorn/prefer-spread
      return accumulator.concat(value);
    }, []);
  }

  /**
   * Properties not coming from components
   */
  private getApiProperties(): PropertySignature[] {
    // A lot of these are pretty generic, would like to convert to relevant objects
    // const APIProperties: property[] = [
    //   // 📈
    //   ...(['roles'].map((index) => ({
    //     key: index,
    //     type: this.string,
    //     array: true,
    //   })) as property[]),
    //   { key: 'state', union: ['submitted'] },
    //   { key: 'deleted', optional: true, type: this.boolean },
    //   ...(['access', 'externalIds', 'externalTokens'].map((index) => ({
    //     key: index,
    //     type: this.unknown,
    //     array: true,
    //   })) as property[]),
    //   ...(['owner', 'form', 'project', 'created', 'modified', '_id'].map(
    //     (index) => ({
    //       key: index,
    //       type: this.string,
    //     }),
    //   ) as property[]),
    // ];

    // return this.flatten<PropertySignature>(
    //   Object.keys(APIProperties).map((key) =>
    //     APIProperties[key].map((def: property) => {
    //       let type: TypeNode = def.type || this.stringUnion(def.union);
    //       if (def.array) {
    //         type = factory.createArrayTypeNode(type);
    //       }
    //       return this.createProperty(def.key, type, def.optional);
    //     }),
    //   ),
    // );
    return;
  }

  private async getIdentifier(
    name: string,
    waitForCreate = false,
  ): Promise<Identifier> {
    if (this.context.identifiers.has(name)) {
      return this.context.identifiers.get(name);
    }
    /**
     * PICK UP HERE:
     *
     * Working on forms
     * component.form = formId
     *
     * Need to set up identifier registry to trace back id to name (and the relevant type)
     */
    if (waitForCreate) {
      await new Promise((done) =>
        this.context.waitingForIdentifiers.set(name, [
          ...(this.context.waitingForIdentifiers.get(name) || []),
          done,
        ]),
      );
    }
    this.context.identifiers.set(
      name,
      this.context.identifiers.get(name) || factory.createIdentifier(name),
    );
    if (this.context.waitingForIdentifiers.has(name)) {
      this.context.waitingForIdentifiers.get(name).forEach((index) => index());
      this.context.waitingForIdentifiers.delete(name);
    }
    return this.context.identifiers.get(name);
  }

  /**
   * Record<type, values>
   */
  private record(type: TypeNode, values: TypeNode) {
    return factory.createTypeReferenceNode(factory.createIdentifier('Record'), [
      type,
      values,
    ]);
  }

  private reset() {
    this.context = this.context || {};
    this.context.declarationList = new Map();
    this.context.waitingForIdentifiers = new Map();
  }

  /**
   * ['a',{key:'B'}] => 'a' | 'B'
   */
  private stringUnion<T extends LabelValue | string | StringLiteral>(
    items: T[],
    key?: string,
  ) {
    // item[0] | item[0] | item[0]
    return factory.createUnionTypeNode(
      items.map((index) => {
        if (key !== null) {
          // TODO: Is 'value' the correct default, or
          index = index[key || 'value'];
        }
        if (typeof index === 'string') {
          index = factory.createStringLiteral(index) as T;
        }
        return factory.createLiteralTypeNode(index as StringLiteral);
      }),
    );
  }

  /**
   * Convert an array of components into an array of properties for the type
   *
   * There is not a 1=1 relationship in arrays
   */
  private async toProperties(
    componentList: Component[],
  ): Promise<PropertySignature[]> {
    let out = [];
    await Promise.all(
      componentList.map(async (component) => {
        // TODO: Unsupported components -
        // Address (no api key to confirm with on hand)
        // Edit Grid (I'm stupid, how does this work? Send help)

        const groups = this.extractGroups(component);
        if (groups !== null) {
          // eslint-disable-next-line unicorn/prefer-spread
          out = out.concat(groups);
          return;
        }

        // Not an input. html or something?
        // I don't /think/ it has a way of affecting type info in this situation
        if (component.input !== true) {
          return;
        }

        // Validator thinks it isn't required
        // Protected inputs won't appear in incoming data
        //// Someone might use this type to provide that data going out though, so it's preserved as optional
        const isOptional = component.protected || !component.validate?.required;

        switch (component.type) {
          case 'signature':
            out.push(
              this.createProperty(
                component.key,
                this.stringUnion(['YES', 'NO']),
                isOptional,
              ),
            );
            return;
          case 'datamap':
            out.push(
              this.createProperty(
                component.key,
                this.record(this.string, this.string),
                isOptional,
              ),
            );
            return;
        }

        // Resolve external options
        // FIXME: resource
        switch (component.dataSrc) {
          case 'json':
            component.data.values = JSON.parse(component.data.json);
            break;
          case 'url':
            component.data.values = (await this.valuesFromUrl(
              component,
            )) as LabelValue[];
            break;
        }

        // Anything kind enough to hand us a type
        const simpleTypes = {
          auto: SyntaxKind.UnknownKeyword,
          boolean: SyntaxKind.BooleanKeyword,
          number: SyntaxKind.NumberKeyword,
          string: SyntaxKind.StringKeyword,
        };
        let type: TypeNode;
        type = simpleTypes[component.dataType]
          ? factory.createKeywordTypeNode(simpleTypes[component.dataType])
          : this.unknown;

        if (component.dataType === 'object') {
          this.logger.warn(
            `Using type "Record<string, unknown>" for key ${component.key}`,
          );
          type = this.record(this.string, this.unknown);
        }

        // Handling the "value" property
        // Survey
        type = component.questions
          ? this.record(
              this.stringUnion(component.questions),
              this.stringUnion(component.values),
            )
          : this.stringUnion(
              component.data.values,
              component.valueProperty || 'value',
            );

        // key: value => key: value[]
        if (component.storeas === 'array' || component.multiple) {
          type = factory.createArrayTypeNode(type);
        }

        out.push(this.createProperty(component.key, type, isOptional));
      }),
    );
    // FIXME: Sort by key
    return out;
  }

  private async treeBuilder(body: TypeLiteralNode, component: Component) {
    const name = `_${this.context.baseName}_${component.key}_${TypeWriterService.DEFINITION_KEYWORD}`;
    await this.getIdentifier(name);
    const recursiveName = `_${this.context.baseName}_${component.key}_${TypeWriterService.RECURSIVE_KEYWORD}`;
    const identifier = await this.getIdentifier(recursiveName);
    await this.addDeclaration(name, body);

    const rTreeName = factory.createTypeReferenceNode(identifier);

    const recursiveBody = factory.createTypeLiteralNode([
      await this.createProperty(
        'body',
        factory.createTypeReferenceNode(identifier),
      ),
      await this.createProperty(
        'children',
        factory.createArrayTypeNode(rTreeName),
      ),
    ]);

    this.addDeclaration(recursiveName, recursiveBody, false);
    return rTreeName;
  }

  // #endregion Private Methods
}
