// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare D1 adapter
// Translates the generic DatabaseAdapter interface to D1 SQL operations.
// Uses snake_case columns in D1, camelCase in application layer.
// ─────────────────────────────────────────────────────────────────────────────

import type { DatabaseAdapter, ModelName, WhereClause } from "../types/index.js";

// ── Table name map ────────────────────────────────────────────────────────────

const TABLE_NAMES: Record<ModelName, string> = {
  user: "ga_users",
  session: "ga_sessions",
  account: "ga_accounts",
  verification: "ga_verifications",
};

// ── camelCase ↔ snake_case ────────────────────────────────────────────────────

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function rowToObject(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = toCamel(k);
    // Convert integer booleans back to boolean
    if (typeof v === "number" && (k.endsWith("_verified") || k.startsWith("is_") || k.endsWith("_enabled"))) {
      out[camel] = Boolean(v);
    }
    // Convert integer timestamps to Date
    else if (typeof v === "number" && (k.endsWith("_at") || k.endsWith("_expiry"))) {
      out[camel] = new Date(v * 1000);
    }
    // Convert text timestamps to Date
    else if (typeof v === "string" && (k.endsWith("_at") || k.endsWith("_expiry"))) {
      out[camel] = new Date(v);
    }
    else {
      out[camel] = v;
    }
  }
  return out;
}

function toD1Value(value: unknown): unknown {
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function buildWhere(where: WhereClause): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const clause of where) {
    const col = toSnake(clause.field);
    const op = clause.operator ?? "eq";
    const val = toD1Value(clause.value);

    switch (op) {
      case "eq":
        if (val === null) {
          conditions.push(`${col} IS NULL`);
        } else {
          conditions.push(`${col} = ?`);
          params.push(val);
        }
        break;
      case "ne":
        if (val === null) {
          conditions.push(`${col} IS NOT NULL`);
        } else {
          conditions.push(`${col} != ?`);
          params.push(val);
        }
        break;
      case "gt":
        conditions.push(`${col} > ?`);
        params.push(val);
        break;
      case "gte":
        conditions.push(`${col} >= ?`);
        params.push(val);
        break;
      case "lt":
        conditions.push(`${col} < ?`);
        params.push(val);
        break;
      case "lte":
        conditions.push(`${col} <= ?`);
        params.push(val);
        break;
      case "in":
        if (Array.isArray(val) && val.length > 0) {
          conditions.push(`${col} IN (${val.map(() => "?").join(",")})`);
          params.push(...val);
        }
        break;
      case "like":
        conditions.push(`${col} LIKE ?`);
        params.push(val);
        break;
    }
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

// ── Adapter factory ───────────────────────────────────────────────────────────

export function createD1Adapter(db: D1Database): DatabaseAdapter {
  return {
    async findOne({ model, where, select }) {
      const table = TABLE_NAMES[model];
      const { sql: whereSql, params } = buildWhere(where);
      const cols = select ? select.map(toSnake).join(", ") : "*";
      const sql = `SELECT ${cols} FROM ${table} ${whereSql} LIMIT 1`;

      const result = await db.prepare(sql).bind(...params).first<Record<string, unknown>>();
      return result ? rowToObject(result) as never : null;
    },

    async findMany({ model, where = [], limit, offset, orderBy }) {
      const table = TABLE_NAMES[model];
      const { sql: whereSql, params } = buildWhere(where);

      let sql = `SELECT * FROM ${table} ${whereSql}`;
      if (orderBy) sql += ` ORDER BY ${toSnake(orderBy.field)} ${orderBy.direction.toUpperCase()}`;
      if (limit) sql += ` LIMIT ${limit}`;
      if (offset) sql += ` OFFSET ${offset}`;

      const result = await db.prepare(sql).bind(...params).all<Record<string, unknown>>();
      return (result.results ?? []).map((r) => rowToObject(r) as never);
    },

    async create({ model, data }) {
      const table = TABLE_NAMES[model];
      const cols = Object.keys(data).map(toSnake);
      const vals = Object.values(data).map(toD1Value);
      const placeholders = vals.map(() => "?").join(", ");

      const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const result = await db.prepare(sql).bind(...vals).first<Record<string, unknown>>();

      if (!result) throw new Error(`D1 create failed for ${model}`);
      return rowToObject(result) as never;
    },

    async update({ model, where, data }) {
      const table = TABLE_NAMES[model];
      const setCols = Object.keys(data).map(toSnake);
      const setVals = Object.values(data).map(toD1Value);
      const setClause = setCols.map((c) => `${c} = ?`).join(", ");

      const { sql: whereSql, params: whereParams } = buildWhere(where);
      const sql = `UPDATE ${table} SET ${setClause} ${whereSql} RETURNING *`;

      const result = await db
        .prepare(sql)
        .bind(...setVals, ...whereParams)
        .first<Record<string, unknown>>();

      return result ? rowToObject(result) as never : null;
    },

    async delete({ model, where }) {
      const table = TABLE_NAMES[model];
      const { sql: whereSql, params } = buildWhere(where);
      const sql = `DELETE FROM ${table} ${whereSql}`;
      await db.prepare(sql).bind(...params).run();
    },

    async count({ model, where = [] }) {
      const table = TABLE_NAMES[model];
      const { sql: whereSql, params } = buildWhere(where);
      const sql = `SELECT COUNT(*) as cnt FROM ${table} ${whereSql}`;
      const result = await db.prepare(sql).bind(...params).first<{ cnt: number }>();
      return result?.cnt ?? 0;
    },
  };
}
