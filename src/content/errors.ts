export class ContentValidationError extends Error {
  constructor(
    message: string,
    public readonly file: string,
    public readonly issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message)
    this.name = 'ContentValidationError'
  }
}
