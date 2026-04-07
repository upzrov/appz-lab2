import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Equipment, CourseLevel, DisciplineTemplate } from "../core/enums";
import {
  StudentActivityEventArgs,
  SystemNotificationEventArgs,
} from "../core/events";
import { DisciplineFactory } from "../core/entities";
import { UniversityService } from "../bll/university.service";

import type { IObserver } from "../core/interfaces";

class ConsoleObserver implements IObserver<
  StudentActivityEventArgs | SystemNotificationEventArgs
> {
  public update(
    args: StudentActivityEventArgs | SystemNotificationEventArgs,
  ): void {
    if (args instanceof StudentActivityEventArgs) {
      console.log(
        `Activity: ${args.studentName}, success: ${args.success}, ${args.message}`,
      );
    } else if (args instanceof SystemNotificationEventArgs) {
      console.log(`System: ${args.message}`);
    }
  }
}

export class ConsoleMenu {
  private rl = readline.createInterface({ input, output });
  private service: UniversityService;

  constructor() {
    this.service = new UniversityService();
    const observer = new ConsoleObserver();
    this.service.onStudentActivity.subscribe(observer);
    this.service.onSystemNotification.subscribe(observer);
  }

  private async prompt(question: string): Promise<string> {
    return await this.rl.question(question);
  }

  private async pause(): Promise<void> {
    await this.prompt("\nPress Enter to continue...");
    console.clear();
  }

  public async start(): Promise<void> {
    console.clear();
    while (true) {
      console.log("MAIN MENU");
      console.log("1. Groups");
      console.log("2. Students");
      console.log("3. Teachers");
      console.log("4. Subgroups");
      console.log("5. Disciplines");
      console.log("6. Operations");
      console.log("7. View All University Members");
      console.log("0. Exit");

      const option = await this.prompt("Select: ");
      try {
        switch (option) {
          case "1":
            await this.crudGroups();
            break;
          case "2":
            await this.crudStudents();
            break;
          case "3":
            await this.crudTeachers();
            break;
          case "4":
            await this.crudSubgroups();
            break;
          case "5":
            await this.crudDisciplines();
            break;
          case "6":
            await this.operationsMenu();
            break;
          case "7":
            this.viewDirectory();
            break;
          case "0":
            this.rl.close();
            return;
          default:
            console.log("Invalid option");
        }
      } catch (e: any) {
        console.log(`\nERROR: ${e.message}`);
      }
      if (option !== "0") await this.pause();
    }
  }

  private viewDirectory(): void {
    console.log("\nUNIVERSITY DIRECTORY");
    const members = this.service.getDirectory(); // This stayed on the Facade
    if (members.length === 0) {
      console.log("No members found.");
      return;
    }
    members.forEach((member) => {
      console.log(`ID: ${member.id} | ${member.getDetails()}`);
    });
  }

  private async crudGroups(): Promise<void> {
    console.log("\nGROUPS");
    console.log("1. List  2. Create  3. Update  4. Delete");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      console.table(
        this.service.groups
          .getGroups()
          .map((g) => ({ ID: g.id, Level: g.courseLevel })),
      );
    } else if (opt === "2") {
      const id = await this.prompt("Group ID: ");
      const level = Number(await this.prompt("Course Level (1-4): "));
      this.service.groups.createGroup(id, level as CourseLevel);
    } else if (opt === "3") {
      const id = await this.prompt("Group ID to update: ");
      const level = Number(await this.prompt("New Course Level (1-4): "));
      this.service.groups.updateGroup(id, level as CourseLevel);
    } else if (opt === "4") {
      const id = await this.prompt("Group ID to delete: ");
      this.service.groups.deleteGroup(id);
    }
  }

  private async crudStudents(): Promise<void> {
    console.log("\nSTUDENTS");
    console.log("1. List  2. Create  3. Update  4. Delete");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      console.table(
        this.service.students.getStudents().map((s) => ({
          ID: s.id,
          Name: s.name,
          Equipment: s.equipment,
          Works: s.passedWorks,
        })),
      );
    } else if (opt === "2") {
      const name = await this.prompt("Name: ");
      const eq = Number(
        await this.prompt("Equipment (0=None, 1=PC, 2=Laptop): "),
      );
      const gid = await this.prompt("Parent Group ID: ");
      this.service.students.createStudent(name, eq as Equipment, gid);
    } else if (opt === "3") {
      const id = await this.prompt("Student ID to update (e.g., S1): ");
      const name = await this.prompt("New Name: ");
      const eq = Number(await this.prompt("New Equipment (0-2): "));
      this.service.students.updateStudent(id, name, eq as Equipment);
    } else if (opt === "4") {
      const id = await this.prompt("Student ID to delete (e.g., S1): ");
      this.service.students.deleteStudent(id);
    }
  }

  private async crudTeachers(): Promise<void> {
    console.log("\nTEACHERS");
    console.log("1. List  2. Create  3. Update  4. Delete");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      console.table(
        this.service.teachers.getTeachers().map((t) => ({
          ID: t.id,
          Name: t.name,
          Discipline: t.activeDisciplineName,
        })),
      );
    } else if (opt === "2") {
      const name = await this.prompt("Name: ");
      this.service.teachers.createTeacher(name);
    } else if (opt === "3") {
      const id = await this.prompt("Teacher ID to update (e.g., T1): ");
      const name = await this.prompt("New Name: ");
      this.service.teachers.updateTeacher(id, name);
    } else if (opt === "4") {
      const id = await this.prompt("Teacher ID to delete (e.g., T1): ");
      this.service.teachers.deleteTeacher(id);
    }
  }

  private async crudSubgroups(): Promise<void> {
    console.log("\nSUBGROUPS");
    console.log("1. List  2. Create  3. Update  4. Delete");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      console.table(
        this.service.groups.getSubgroups().map((sg) => ({
          ID: sg.id,
          Parent: sg.parentGroup.id,
          Size: sg.getStudents().length,
        })),
      );
    } else if (opt === "2") {
      const gid = await this.prompt("Parent Group ID: ");
      const sids = (
        await this.prompt("Student IDs (comma separated, e.g., S1,S2): ")
      ).split(",");
      this.service.groups.createSubgroup(gid, sids);
    } else if (opt === "3") {
      const id = await this.prompt("Subgroup ID to update (e.g., SG1): ");
      const sids = (
        await this.prompt("New Student IDs (comma separated): ")
      ).split(",");
      this.service.groups.updateSubgroup(id, sids);
    } else if (opt === "4") {
      const id = await this.prompt("Subgroup ID to delete (e.g., SG1): ");
      this.service.groups.deleteSubgroup(id);
    }
  }

  private async crudDisciplines(): Promise<void> {
    console.log("\nDISCIPLINES");
    console.log("1. List  2. Create  3. Update  4. Delete");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      console.table(
        this.service.disciplines.getDisciplines().map((d) => ({
          Name: d.name,
          Hours: d.totalHours,
          Courses: d.allowedCourses.join(","),
        })),
      );
    } else if (opt === "2") {
      console.log("\nAvailable templates):");
      console.log("1. Basics of Programming (1 Course)");
      console.log("2. Algorithms and Data Structures (2 Course)");
      console.log("3. OOP (1-2 Course)");

      const tplInput = Number(await this.prompt("Select Template: "));

      // Ensure the input matches one of the Enum values
      if (!Object.values(DisciplineTemplate).includes(tplInput)) {
        throw new Error("Invalid template selected.");
      }

      const discipline = DisciplineFactory.createDiscipline(
        tplInput as DisciplineTemplate,
      );
      this.service.disciplines.createDiscipline(discipline);
    } else if (opt === "3") {
      const name = await this.prompt("Exact Discipline Name to update: ");
      const hours = Number(await this.prompt("New Total Hours (>=64): "));
      const levels = (
        await this.prompt("Allowed Courses (comma separated 1-4): ")
      )
        .split(",")
        .map(Number);
      this.service.disciplines.updateDiscipline(
        name,
        hours,
        levels as CourseLevel[],
      );
    } else if (opt === "4") {
      const name = await this.prompt("Exact Discipline Name to delete: ");
      this.service.disciplines.deleteDiscipline(name);
    }
  }

  private async operationsMenu(): Promise<void> {
    console.log("\nOPERATIONS");
    console.log("1. Assign Teacher to Discipline");
    console.log("2. Conduct Lab Work");
    const opt = await this.prompt("Select: ");
    if (opt === "1") {
      const tid = await this.prompt("Teacher ID: ");
      const dName = await this.prompt("Discipline Name: ");
      this.service.operations.assignTeacherToDiscipline(tid, dName);
    } else if (opt === "2") {
      const sid = await this.prompt("Student ID: ");
      const dname = await this.prompt("Discipline Name: ");
      this.service.operations.conductLabWork(sid, dname);
    }
  }
}
