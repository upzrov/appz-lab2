import { DataContext } from "../dal/data-context";
import { EventDispatcher, SystemNotificationEventArgs } from "../core/events";
import { Teacher } from "../core/entities";

export class TeacherService {
  private nextTeacherId = 1;

  constructor(
    private db: DataContext,
    private notifier: EventDispatcher<SystemNotificationEventArgs>,
  ) {}

  public createTeacher(name: string): void {
    const id = `T${this.nextTeacherId++}`;
    this.db.teachers.set(id, new Teacher(id, name));
    this.notifier.notify(
      new SystemNotificationEventArgs(
        `Teacher '${name}' created with ID: ${id}`,
      ),
    );
  }

  public getTeachers(): Teacher[] {
    return Array.from(this.db.teachers.values());
  }

  public updateTeacher(id: string, name: string): void {
    const teacher = this.db.teachers.get(id);
    if (!teacher) throw new Error(`Teacher with ID '${id}' not found.`);
    teacher.updateName(name);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Teacher '${id}' updated.`),
    );
  }

  public deleteTeacher(id: string): void {
    const teacher = this.db.teachers.get(id);
    if (!teacher) throw new Error(`Teacher with ID '${id}' not found.`);
    if (teacher.activeDisciplineName) {
      const discipline = this.db.disciplines.get(teacher.activeDisciplineName);
      if (discipline) discipline.removeTeacher(id);
    }
    this.db.teachers.delete(id);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Teacher '${id}' deleted.`),
    );
  }
}
