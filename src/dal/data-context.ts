import {
  Discipline,
  Group,
  Student,
  Subgroup,
  Teacher,
} from "../core/entities";

export class DataContext {
  public readonly students: Map<string, Student> = new Map();
  public readonly disciplines: Map<string, Discipline> = new Map();
  public readonly groups: Map<string, Group> = new Map();
  public readonly subgroups: Map<string, Subgroup> = new Map();
  public readonly teachers: Map<string, Teacher> = new Map();
}
