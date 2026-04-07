import { DataContext } from "../dal/data-context";
import { EventDispatcher, SystemNotificationEventArgs } from "../core/events";
import { Equipment } from "../core/enums";
import { Student } from "../core/entities";

export class StudentService {
  private nextStudentId = 1;

  constructor(
    private db: DataContext,
    private notifier: EventDispatcher<SystemNotificationEventArgs>,
  ) {}

  public createStudent(
    name: string,
    equipment: Equipment,
    groupId: string,
  ): void {
    const group = this.db.groups.get(groupId);
    if (!group) throw new Error(`Group '${groupId}' not found.`);

    const id = `S${this.nextStudentId++}`;
    const student = new Student(id, name, equipment);
    group.addStudent(student);
    this.db.students.set(id, student);
    this.notifier.notify(
      new SystemNotificationEventArgs(
        `Student '${name}' created with ID: ${id}`,
      ),
    );
  }

  public getStudents(): Student[] {
    return Array.from(this.db.students.values());
  }

  public updateStudent(id: string, name: string, equipment: Equipment): void {
    const student = this.db.students.get(id);
    if (!student) throw new Error(`Student with ID '${id}' not found.`);
    student.updateProfile(name, equipment);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Student '${id}' updated.`),
    );
  }

  public deleteStudent(id: string): void {
    if (!this.db.students.has(id))
      throw new Error(`Student with ID '${id}' not found.`);
    this.db.students.delete(id);
    for (const group of this.db.groups.values()) group.removeStudent(id);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Student '${id}' deleted.`),
    );
  }
}
