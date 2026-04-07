import {
  ActivityType,
  CourseLevel,
  DisciplineTemplate,
  Equipment,
} from "./enums";

import type { IUniversityMember } from "./interfaces";

export class Student implements IUniversityMember {
  private _passedWorks: number = 0;
  private _passedMCW: boolean = false;
  private _passedExam: boolean = false;
  public readonly role: string = "Student";

  constructor(
    public readonly id: string,
    private _name: string,
    private _equipment: Equipment,
  ) {}

  public get name(): string {
    return this._name;
  }
  public get equipment(): Equipment {
    return this._equipment;
  }
  public get passedWorks(): number {
    return this._passedWorks;
  }

  public getDetails(): string {
    return `[${this.role}] ${this.name} | Equipment: ${Equipment[this.equipment]} | Works: ${this._passedWorks}`;
  }

  public updateProfile(name: string, equipment: Equipment): void {
    if (name.trim() === "") throw new Error("Student name cannot be empty.");

    this._name = name;
    this._equipment = equipment;
  }

  public completeWork(): void {
    this._passedWorks++;
  }
  public completeExam(): void {
    this._passedExam = true;
  }
}

export class Teacher implements IUniversityMember {
  private _activeDisciplineName: string | null = null;
  public readonly role: string = "Teacher";

  constructor(
    public readonly id: string,
    private _name: string,
  ) {}

  public get name(): string {
    return this._name;
  }
  public get activeDisciplineName(): string | null {
    return this._activeDisciplineName;
  }

  public getDetails(): string {
    const teaching = this._activeDisciplineName
      ? `Teaching: ${this._activeDisciplineName}`
      : "Not assigned";
    return `[${this.role}] ${this.name} | ${teaching}`;
  }

  public updateName(name: string): void {
    if (name.trim() === "") throw new Error("Teacher name cannot be empty.");

    this._name = name;
  }

  public assignDiscipline(disciplineName: string): void {
    if (
      this._activeDisciplineName !== null &&
      this._activeDisciplineName !== disciplineName
    ) {
      throw new Error(
        `Teacher is already teaching ${this._activeDisciplineName}.`,
      );
    }
    this._activeDisciplineName = disciplineName;
  }

  public unassignDiscipline(): void {
    this._activeDisciplineName = null;
  }
}

export class Group {
  private students: Map<string, Student> = new Map();

  constructor(
    public readonly id: string,
    private _courseLevel: CourseLevel,
  ) {}

  public get courseLevel(): CourseLevel {
    return this._courseLevel;
  }
  public updateCourseLevel(level: CourseLevel): void {
    this._courseLevel = level;
  }

  public addStudent(student: Student): void {
    if (this.students.has(student.id))
      throw new Error("Student already in group.");
    this.students.set(student.id, student);
  }

  public removeStudent(studentId: string): void {
    this.students.delete(studentId);
  }
  public getStudents(): Student[] {
    return Array.from(this.students.values());
  }
}

export class Subgroup {
  private students: Map<string, Student> = new Map();

  constructor(
    public readonly id: string,
    public readonly parentGroup: Group,
    studentsList: Student[],
  ) {
    this.setStudents(studentsList);
  }

  public setStudents(studentsList: Student[]): void {
    if (studentsList.length < 10)
      throw new Error(
        `Subgroup must have at least 10 students. Provided: ${studentsList.length}`,
      );

    this.students.clear();
    for (const s of studentsList) this.students.set(s.id, s);
  }

  public getStudents(): Student[] {
    return Array.from(this.students.values());
  }
}

export class DisciplineActivity {
  constructor(
    public readonly type: ActivityType,
    public readonly hours: number,
  ) {}
}

export class Discipline {
  private teachers: Map<string, Teacher> = new Map();
  public readonly activities: DisciplineActivity[] = [];

  constructor(
    public readonly name: string,
    private _allowedCourses: CourseLevel[],
    private _totalHours: number,
    public readonly hasCredit: boolean,
    public readonly hasExam: boolean,
  ) {
    this.validateHours(_totalHours);
  }

  public get totalHours(): number {
    return this._totalHours;
  }
  public get allowedCourses(): CourseLevel[] {
    return [...this._allowedCourses];
  }

  public updateDetails(
    totalHours: number,
    allowedCourses: CourseLevel[],
  ): void {
    this.validateHours(totalHours);
    this._totalHours = totalHours;
    this._allowedCourses = allowedCourses;
  }

  private validateHours(hours: number): void {
    if (hours < 64)
      throw new Error(`Discipline '${this.name}' must have at least 64 hours.`);
  }

  public addActivity(activity: DisciplineActivity): void {
    this.activities.push(activity);
  }

  public assignTeacher(teacher: Teacher, subgroupsCount: number): void {
    const maxTeachers = subgroupsCount + 1;
    if (this.teachers.size >= maxTeachers && !this.teachers.has(teacher.id)) {
      throw new Error(
        `Max allowed teachers (${maxTeachers}) reached for '${this.name}'.`,
      );
    }
    teacher.assignDiscipline(this.name);
    this.teachers.set(teacher.id, teacher);
  }

  public removeTeacher(teacherId: string): void {
    const teacher = this.teachers.get(teacherId);
    if (teacher) {
      teacher.unassignDiscipline();
      this.teachers.delete(teacherId);
    }
  }

  public getTeachers(): Teacher[] {
    return Array.from(this.teachers.values());
  }
  public isCourseAllowed(course: CourseLevel): boolean {
    return this._allowedCourses.includes(course);
  }
}

export class DisciplineFactory {
  public static createDiscipline(template: DisciplineTemplate): Discipline {
    switch (template) {
      case DisciplineTemplate.BasicsOfProgramming: {
        const d = new Discipline(
          "Basics of Programming",
          [CourseLevel.First],
          72,
          true,
          false,
        );
        d.addActivity(new DisciplineActivity(ActivityType.Lecture, 36));
        d.addActivity(new DisciplineActivity(ActivityType.Lab, 36));
        return d;
      }
      case DisciplineTemplate.AlgorithmsAndDataStructures: {
        const d = new Discipline(
          "Algorithms and Data Structures",
          [CourseLevel.Second],
          90,
          false,
          true,
        );
        d.addActivity(new DisciplineActivity(ActivityType.Lecture, 30));
        d.addActivity(new DisciplineActivity(ActivityType.Lab, 30));
        d.addActivity(new DisciplineActivity(ActivityType.Coursework, 30));
        return d;
      }
      case DisciplineTemplate.OOP: {
        const d = new Discipline(
          "OOP",
          [CourseLevel.First, CourseLevel.Second],
          120,
          false,
          true,
        );
        d.addActivity(new DisciplineActivity(ActivityType.Lecture, 40));
        d.addActivity(new DisciplineActivity(ActivityType.Lab, 40));
        d.addActivity(new DisciplineActivity(ActivityType.Coursework, 40));
        return d;
      }
      default:
        throw new Error("Unknown discipline template.");
    }
  }
}
