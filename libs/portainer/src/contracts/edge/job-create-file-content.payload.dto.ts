export class JobCreateFileContentPayloadDTO {
  public cronExpression?: string;
  public endpoints?: number[];
  public fileContent?: string;
  public name?: string;
  public recurring?: boolean;
}