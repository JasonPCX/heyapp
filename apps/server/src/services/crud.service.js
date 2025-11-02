import { db } from "#utils/db.js";
import { and, eq, isNull } from "drizzle-orm";

export class CrudService {
  static tableSchema;

  constructor(tableSchema) {
    this.tableSchema = tableSchema;
  }

  static async getAll() {
    return db
      .select()
      .from(this.tableSchema)
      .where(isNull(this.tableSchema.deletedAt));
  }

  static async create(data) {
    const result = await db.insert(this.tableSchema).values(data).returning();
    return result;
  }

  static async findById(id) {
    const [result] = await db
      .select()
      .from(this.tableSchema)
      .where(
        and(eq(this.tableSchema.id, id), isNull(this.tableSchema.deletedAt))
      );
    
    return result;
  }

  static async update(id, data) {
    const result = await db
      .update(this.tableSchema)
      .set(data)
      .where(eq(this.tableSchema.id, id))
      .returning();
    return result;
  }

  static async delete(id) {
    const result = await db
      .delete(this.tableSchema)
      .where(eq(this.tableSchema.id, id))
      .returning({ deletedId: this.tableSchema.id });
    return result;
  }
}
