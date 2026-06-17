export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export * from './ai';
export * from './plant';
export * from './user';
export * from './telegram';
