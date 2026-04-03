import { ActivityType } from "./enums";

import type { IObserver } from "./interfaces";

export class Subscription<T> {
  constructor(
    private observers: IObserver<T>[],
    private observer: IObserver<T>,
  ) {}

  public unsubscribe(): void {
    const index = this.observers.indexOf(this.observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
}

export class EventDispatcher<T> {
  private observers: IObserver<T>[] = [];

  public subscribe(observer: IObserver<T>): Subscription<T> {
    this.observers.push(observer);
    return new Subscription<T>(this.observers, observer);
  }

  public notify(args: T): void {
    for (const observer of this.observers) {
      observer.update(args);
    }
  }
}

export class StudentActivityEventArgs {
  constructor(
    public readonly studentName: string,
    public readonly activityType: ActivityType,
    public readonly success: boolean,
    public readonly message: string,
  ) {}
}

export class SystemNotificationEventArgs {
  constructor(public readonly message: string) {}
}
