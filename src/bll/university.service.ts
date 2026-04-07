import {
  EventDispatcher,
  StudentActivityEventArgs,
  SystemNotificationEventArgs,
} from "../core/events";
import { DataContext } from "../dal/data-context";
import { StudentService } from "./student.service";
import { GroupService } from "./group.service";
import { TeacherService } from "./teacher.service";
import { DisciplineService } from "./discipline.service";
import { AcademicProcessService } from "./academic-process.service";

import type { IUniversityMember } from "../core/interfaces";

export class UniversityService {
  public readonly onStudentActivity =
    new EventDispatcher<StudentActivityEventArgs>();
  public readonly onSystemNotification =
    new EventDispatcher<SystemNotificationEventArgs>();

  private db: DataContext;

  public readonly students: StudentService;
  public readonly groups: GroupService;
  public readonly teachers: TeacherService;
  public readonly disciplines: DisciplineService;
  public readonly operations: AcademicProcessService;

  constructor() {
    this.db = new DataContext();

    // Wire up the dependencies
    this.students = new StudentService(this.db, this.onSystemNotification);
    this.groups = new GroupService(this.db, this.onSystemNotification);
    this.teachers = new TeacherService(this.db, this.onSystemNotification);
    this.disciplines = new DisciplineService(
      this.db,
      this.onSystemNotification,
    );

    this.operations = new AcademicProcessService(
      this.db,
      this.onStudentActivity,
      this.onSystemNotification,
    );
  }

  // Cross-domain aggregation can stay in the facade
  public getDirectory(): IUniversityMember[] {
    const allMembers: IUniversityMember[] = [];
    allMembers.push(...Array.from(this.db.teachers.values()));
    allMembers.push(...Array.from(this.db.students.values()));
    return allMembers;
  }
}
