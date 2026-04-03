import {
  EventDispatcher,
  StudentActivityEventArgs,
  SystemNotificationEventArgs,
} from "../core/events";
import { ActivityType, CourseLevel, Equipment } from "../core/enums";
import {
  Discipline,
  Group,
  Student,
  Subgroup,
  Teacher,
} from "../core/entities";
import { DataContext } from "../dal/data-context";

import type { IUniversityMember } from "../core/interfaces";

export class UniversityService {
  public readonly onStudentActivity =
    new EventDispatcher<StudentActivityEventArgs>();
  public readonly onSystemNotification =
    new EventDispatcher<SystemNotificationEventArgs>();

  private db: DataContext;

  constructor() {
    this.db = new DataContext();
  }

  public getDirectory(): IUniversityMember[] {
    const allMembers: IUniversityMember[] = [];
    allMembers.push(...Array.from(this.db.teachers.values()));
    allMembers.push(...Array.from(this.db.students.values()));
    return allMembers;
  }

  public createStudent(
    id: string,
    name: string,
    equipment: Equipment,
    groupId: string,
  ): void {
    if (this.db.students.has(id)) throw new Error("Student ID already exists");
    const group = this.db.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    const student = new Student(id, name, equipment);
    group.addStudent(student);
    this.db.students.set(id, student);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Student ${name} created`),
    );
  }

  public getStudents(): Student[] {
    return Array.from(this.db.students.values());
  }

  public updateStudent(id: string, name: string, equipment: Equipment): void {
    const student = this.db.students.get(id);
    if (!student) throw new Error("Student not found");
    student.updateProfile(name, equipment);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Student ${id} updated`),
    );
  }

  public deleteStudent(id: string): void {
    if (!this.db.students.has(id)) throw new Error("Student not found");
    this.db.students.delete(id);
    for (const group of this.db.groups.values()) group.removeStudent(id);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Student ${id} deleted`),
    );
  }

  public createGroup(id: string, level: CourseLevel): void {
    if (this.db.groups.has(id)) throw new Error("Group ID already exists");
    this.db.groups.set(id, new Group(id, level));
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Group ${id} created`),
    );
  }

  public getGroups(): Group[] {
    return Array.from(this.db.groups.values());
  }

  public updateGroup(id: string, level: CourseLevel): void {
    const group = this.db.groups.get(id);
    if (!group) throw new Error("Group not found");
    group.updateCourseLevel(level);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Group ${id} updated`),
    );
  }

  public deleteGroup(id: string): void {
    const group = this.db.groups.get(id);
    if (!group) throw new Error("Group not found");
    if (group.getStudents().length > 0)
      throw new Error("Cannot delete group with students");
    this.db.groups.delete(id);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Group ${id} deleted`),
    );
  }

  public createSubgroup(
    id: string,
    groupId: string,
    studentIds: string[],
  ): void {
    if (this.db.subgroups.has(id))
      throw new Error("Subgroup ID already exists");
    const group = this.db.groups.get(groupId);
    if (!group) throw new Error("Group not found");

    const subgroupStudents = group
      .getStudents()
      .filter((s) => studentIds.includes(s.id));
    const subgroup = new Subgroup(id, group, subgroupStudents);
    this.db.subgroups.set(id, subgroup);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Subgroup ${id} created`),
    );
  }

  public getSubgroups(): Subgroup[] {
    return Array.from(this.db.subgroups.values());
  }

  public updateSubgroup(id: string, studentIds: string[]): void {
    const subgroup = this.db.subgroups.get(id);
    if (!subgroup) throw new Error("Subgroup not found");
    const subgroupStudents = subgroup.parentGroup
      .getStudents()
      .filter((s) => studentIds.includes(s.id));
    subgroup.setStudents(subgroupStudents);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Subgroup ${id} updated`),
    );
  }

  public deleteSubgroup(id: string): void {
    if (!this.db.subgroups.has(id)) throw new Error("Subgroup not found");
    this.db.subgroups.delete(id);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Subgroup ${id} deleted`),
    );
  }

  public createTeacher(id: string, name: string): void {
    if (this.db.teachers.has(id)) throw new Error("Teacher ID already exists");
    this.db.teachers.set(id, new Teacher(id, name));
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Teacher ${name} created`),
    );
  }

  public getTeachers(): Teacher[] {
    return Array.from(this.db.teachers.values());
  }

  public updateTeacher(id: string, name: string): void {
    const teacher = this.db.teachers.get(id);
    if (!teacher) throw new Error("Teacher not found");
    teacher.updateName(name);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Teacher ${id} updated`),
    );
  }

  public deleteTeacher(id: string): void {
    const teacher = this.db.teachers.get(id);
    if (!teacher) throw new Error("Teacher not found");
    if (teacher.activeDisciplineName) {
      const discipline = this.db.disciplines.get(teacher.activeDisciplineName);
      if (discipline) discipline.removeTeacher(id);
    }
    this.db.teachers.delete(id);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Teacher ${id} deleted`),
    );
  }

  public createDiscipline(discipline: Discipline): void {
    if (this.db.disciplines.has(discipline.name))
      throw new Error("Discipline already exists");
    this.db.disciplines.set(discipline.name, discipline);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(
        `Discipline ${discipline.name} registered`,
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
    if (!discipline) throw new Error("Discipline not found");
    discipline.updateDetails(totalHours, allowedCourses);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Discipline ${name} updated`),
    );
  }

  public deleteDiscipline(name: string): void {
    const discipline = this.db.disciplines.get(name);
    if (!discipline) throw new Error("Discipline not found");
    for (const teacher of discipline.getTeachers())
      teacher.unassignDiscipline();
    this.db.disciplines.delete(name);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(`Discipline ${name} deleted`),
    );
  }

  public assignTeacherToDiscipline(
    teacherId: string,
    disciplineName: string,
  ): void {
    const teacher = this.db.teachers.get(teacherId);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!teacher || !discipline)
      throw new Error("Teacher or discipline not found");
    discipline.assignTeacher(teacher, this.db.subgroups.size);
    this.onSystemNotification.notify(
      new SystemNotificationEventArgs(
        `Teacher ${teacher.name} assigned to ${discipline.name}`,
      ),
    );
  }

  public conductLabWork(studentId: string, disciplineName: string): void {
    const student = this.db.students.get(studentId);
    const discipline = this.db.disciplines.get(disciplineName);
    if (!student || !discipline)
      throw new Error("Student or Discipline not found");

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
      this.onStudentActivity.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Lab,
          false,
          "Course level not allowed",
        ),
      );
      return;
    }

    if (student.equipment === Equipment.None) {
      this.onStudentActivity.notify(
        new StudentActivityEventArgs(
          student.name,
          ActivityType.Lab,
          false,
          "No equipment",
        ),
      );
      return;
    }

    student.completeWork();
    this.onStudentActivity.notify(
      new StudentActivityEventArgs(
        student.name,
        ActivityType.Lab,
        true,
        "Lab completed",
      ),
    );
  }
}
