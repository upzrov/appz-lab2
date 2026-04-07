import { DataContext } from "../dal/data-context";
import { EventDispatcher, SystemNotificationEventArgs } from "../core/events";
import { CourseLevel } from "../core/enums";
import { Discipline } from "../core/entities";

export class DisciplineService {
  constructor(
    private db: DataContext,
    private notifier: EventDispatcher<SystemNotificationEventArgs>,
  ) {}

  public createDiscipline(discipline: Discipline): void {
    if (this.db.disciplines.has(discipline.name)) {
      throw new Error(`Discipline '${discipline.name}' already exists.`);
    }
    this.db.disciplines.set(discipline.name, discipline);
    this.notifier.notify(
      new SystemNotificationEventArgs(
        `Discipline '${discipline.name}' registered.`,
      ),
    );
  }

  public getDisciplines(): Discipline[] {
    return Array.from(this.db.disciplines.values());
  }

  public updateDiscipline(
    name: string,
    totalHours: number,
    allowedCourses: CourseLevel[],
  ): void {
    const discipline = this.db.disciplines.get(name);
    if (!discipline) throw new Error(`Discipline '${name}' not found.`);
    discipline.updateDetails(totalHours, allowedCourses);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Discipline '${name}' updated.`),
    );
  }

  public deleteDiscipline(name: string): void {
    const discipline = this.db.disciplines.get(name);
    if (!discipline) throw new Error(`Discipline '${name}' not found.`);

    // Unassign all teachers from this discipline before deleting
    for (const teacher of discipline.getTeachers()) {
      teacher.unassignDiscipline();
    }

    this.db.disciplines.delete(name);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Discipline '${name}' deleted.`),
    );
  }
}
