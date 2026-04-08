import { DataContext } from "../dal/data-context";
import {
  EventDispatcher,
  StudentActivityEventArgs,
  SystemNotificationEventArgs,
} from "../core/events";
import { ActivityType, Equipment } from "../core/enums";

export class AcademicProcessService {
  constructor(
    private db: DataContext,
    private activityNotifier: EventDispatcher<StudentActivityEventArgs>,
    private systemNotifier: EventDispatcher<SystemNotificationEventArgs>,
  ) {}

  public assignTeacherToDiscipline(
    teacherId: string,
    disciplineName: string,
  ): void {
    const teacher = this.db.teachers.get(teacherId);
    if (!teacher) throw new Error(`Teacher with ID '${teacherId}' not found.`);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!discipline)
      throw new Error(`Discipline '${disciplineName}' not found.`);

    discipline.assignTeacher(teacher, this.db.subgroups.size);
    this.systemNotifier.notify(
      new SystemNotificationEventArgs(
        `Teacher '${teacher.name}' assigned to '${discipline.name}'.`,
      ),
    );
  }

  public conductLabWork(studentId: string, disciplineName: string): void {
    const student = this.db.students.get(studentId);
    if (!student) throw new Error(`Student with ID '${studentId}' not found.`);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!discipline)
      throw new Error(`Discipline '${disciplineName}' not found.`);

    let validCourse = false;
    for (const group of this.db.groups.values()) {
      if (
        group.getStudents().some((s) => s.id === studentId) &&
        discipline.isCourseAllowed(group.courseLevel)
      ) {
        validCourse = true;
        break;
      }
    }

    if (!validCourse) {
      this.activityNotifier.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Lab,
          false,
          "Course level not allowed for this discipline.",
        ),
      );
      return;
    }

    if (student.equipment === Equipment.None) {
      this.activityNotifier.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Lab,
          false,
          "No equipment available.",
        ),
      );
      return;
    }

    student.completeWork();
    this.activityNotifier.notify(
      new StudentActivityEventArgs(
        student.name,
        ActivityType.Lab,
        true,
        "Lab completed successfully.",
      ),
    );
  }

  public conductMCW(studentId: string, disciplineName: string): void {
    const student = this.db.students.get(studentId);
    if (!student) throw new Error(`Student with ID '${studentId}' not found.`);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!discipline)
      throw new Error(`Discipline '${disciplineName}' not found.`);

    if (student.passedWorks < 1) {
      this.activityNotifier.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.MCW,
          false,
          "Cannot take MCW. Not enough lab works passed.",
        ),
      );
      return;
    }

    student.completeMCW();
    this.activityNotifier.notify(
      new StudentActivityEventArgs(
        student.name,
        ActivityType.MCW,
        true,
        "MCW passed successfully.",
      ),
    );
  }

  public conductExam(studentId: string, disciplineName: string): void {
    const student = this.db.students.get(studentId);
    if (!student) throw new Error(`Student with ID '${studentId}' not found.`);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!discipline)
      throw new Error(`Discipline '${disciplineName}' not found.`);

    if (!discipline.hasExam) {
      this.activityNotifier.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Exam,
          false,
          `Discipline '${discipline.name}' does not require an exam (Credit only).`,
        ),
      );
      return;
    }

    if (!student.passedMCW) {
      this.activityNotifier.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Exam,
          false,
          "Not admitted to exam. MCW is not passed.",
        ),
      );
      return;
    }

    student.completeExam();
    this.activityNotifier.notify(
      new StudentActivityEventArgs(
        student.name,
        ActivityType.Exam,
        true,
        "Exam passed successfully!",
      ),
    );
  }
}
