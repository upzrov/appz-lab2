export interface IUniversityMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  getDetails(): string;
}

export interface IObserver<T> {
  update(args: T): void;
}
