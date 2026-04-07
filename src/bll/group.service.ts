import { DataContext } from "../dal/data-context";
import { EventDispatcher, SystemNotificationEventArgs } from "../core/events";
import { CourseLevel } from "../core/enums";
import { Group, Subgroup } from "../core/entities";

export class GroupService {
  private nextSubgroupId = 1;

  constructor(
    private db: DataContext,
    private notifier: EventDispatcher<SystemNotificationEventArgs>,
  ) {}

  public createGroup(id: string, level: CourseLevel): void {
    if (this.db.groups.has(id))
      throw new Error(`Group ID '${id}' already exists.`);
    this.db.groups.set(id, new Group(id, level));
    this.notifier.notify(
      new SystemNotificationEventArgs(`Group '${id}' created.`),
    );
  }

  public getGroups(): Group[] {
    return Array.from(this.db.groups.values());
  }

  public updateGroup(id: string, level: CourseLevel): void {
    const group = this.db.groups.get(id);
    if (!group) throw new Error(`Group '${id}' not found.`);
    group.updateCourseLevel(level);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Group '${id}' updated.`),
    );
  }

  public deleteGroup(id: string): void {
    const group = this.db.groups.get(id);
    if (!group) throw new Error(`Group '${id}' not found.`);
    if (group.getStudents().length > 0)
      throw new Error(
        `Cannot delete group '${id}' because it still contains students.`,
      );
    this.db.groups.delete(id);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Group '${id}' deleted.`),
    );
  }

  public createSubgroup(groupId: string, studentIds: string[]): void {
    const group = this.db.groups.get(groupId);
    if (!group) throw new Error(`Group '${groupId}' not found.`);

    const subgroupStudents = group
      .getStudents()
      .filter((s) => studentIds.includes(s.id));
    const id = `SG${this.nextSubgroupId++}`;

    const subgroup = new Subgroup(id, group, subgroupStudents);
    this.db.subgroups.set(id, subgroup);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Subgroup created with ID: ${id}`),
    );
  }

  public getSubgroups(): Subgroup[] {
    return Array.from(this.db.subgroups.values());
  }

  public updateSubgroup(id: string, studentIds: string[]): void {
    const subgroup = this.db.subgroups.get(id);
    if (!subgroup) throw new Error(`Subgroup '${id}' not found.`);
    const subgroupStudents = subgroup.parentGroup
      .getStudents()
      .filter((s) => studentIds.includes(s.id));
    subgroup.setStudents(subgroupStudents);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Subgroup '${id}' updated.`),
    );
  }

  public deleteSubgroup(id: string): void {
    if (!this.db.subgroups.has(id))
      throw new Error(`Subgroup '${id}' not found.`);
    this.db.subgroups.delete(id);
    this.notifier.notify(
      new SystemNotificationEventArgs(`Subgroup '${id}' deleted.`),
    );
  }
}
