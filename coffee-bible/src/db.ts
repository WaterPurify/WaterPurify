import * as SQLite from 'expo-sqlite';
import {
  Bean,
  BeanSnapshot,
  Brew,
  Recipe,
  Recommendation,
  RoastLevel,
  Tasting,
} from './types';

const dbPromise = SQLite.openDatabaseAsync('coffee-bible.db');

type BeanRow = {
  id: number;
  name: string;
  roastery: string | null;
  roasted_at: string | null;
  roast_level: RoastLevel | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
};

type BrewRow = {
  id: number;
  bean_id: number | null;
  bean_snapshot: string;
  brewed_at: string;
  desired_taste: string;
  recipe: string;
  tasting: string;
  source_brew_id: number | null;
  source_recommendation_id: number | null;
  created_at: string;
  updated_at: string;
};

type RecommendationRow = {
  id: number;
  base_brew_id: number;
  condition_name: string;
  before_value: string;
  suggested_value: string;
  reason: string;
  method: '규칙 기반';
  created_at: string;
};

const mapBean = (row: BeanRow): Bean => ({
  id: row.id,
  name: row.name,
  roastery: row.roastery,
  roastedAt: row.roasted_at,
  roastLevel: row.roast_level,
  photoUri: row.photo_uri,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapBrew = (row: BrewRow): Brew => ({
  id: row.id,
  beanId: row.bean_id,
  bean: JSON.parse(row.bean_snapshot) as BeanSnapshot,
  brewedAt: row.brewed_at,
  desiredTaste: row.desired_taste,
  recipe: JSON.parse(row.recipe) as Recipe,
  tasting: JSON.parse(row.tasting) as Tasting,
  sourceBrewId: row.source_brew_id,
  sourceRecommendationId: row.source_recommendation_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapRecommendation = (row: RecommendationRow): Recommendation => ({
  id: row.id,
  baseBrewId: row.base_brew_id,
  conditionName: row.condition_name,
  beforeValue: row.before_value,
  suggestedValue: row.suggested_value,
  reason: row.reason,
  method: row.method,
  createdAt: row.created_at,
});

export async function initializeDatabase() {
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS beans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roastery TEXT,
      roasted_at TEXT,
      roast_level TEXT,
      photo_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS brews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bean_id INTEGER,
      bean_snapshot TEXT NOT NULL,
      brewed_at TEXT NOT NULL,
      desired_taste TEXT NOT NULL DEFAULT '',
      recipe TEXT NOT NULL,
      tasting TEXT NOT NULL,
      source_brew_id INTEGER,
      source_recommendation_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (bean_id) REFERENCES beans(id) ON DELETE SET NULL,
      FOREIGN KEY (source_brew_id) REFERENCES brews(id) ON DELETE SET NULL,
      FOREIGN KEY (source_recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_brew_id INTEGER NOT NULL,
      condition_name TEXT NOT NULL,
      before_value TEXT NOT NULL,
      suggested_value TEXT NOT NULL,
      reason TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT '규칙 기반',
      created_at TEXT NOT NULL,
      FOREIGN KEY (base_brew_id) REFERENCES brews(id) ON DELETE CASCADE
    );
  `);
}

export async function listBeans(): Promise<Bean[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<BeanRow>('SELECT * FROM beans ORDER BY created_at DESC');
  return rows.map(mapBean);
}

export async function getBean(id: number): Promise<Bean | null> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<BeanRow>('SELECT * FROM beans WHERE id = ?', id);
  return row ? mapBean(row) : null;
}

export async function saveBean(input: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>, id?: number) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  if (id) {
    await db.runAsync(
      `UPDATE beans SET name = ?, roastery = ?, roasted_at = ?, roast_level = ?, photo_uri = ?, updated_at = ? WHERE id = ?`,
      input.name,
      input.roastery,
      input.roastedAt,
      input.roastLevel,
      input.photoUri,
      now,
      id,
    );
    return id;
  }
  const result = await db.runAsync(
    `INSERT INTO beans (name, roastery, roasted_at, roast_level, photo_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.name,
    input.roastery,
    input.roastedAt,
    input.roastLevel,
    input.photoUri,
    now,
    now,
  );
  return result.lastInsertRowId;
}

export async function deleteBean(id: number) {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM beans WHERE id = ?', id);
}

export async function listBrews(): Promise<Brew[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<BrewRow>('SELECT * FROM brews ORDER BY brewed_at DESC, id DESC');
  return rows.map(mapBrew);
}

export async function getBrew(id: number): Promise<Brew | null> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<BrewRow>('SELECT * FROM brews WHERE id = ?', id);
  return row ? mapBrew(row) : null;
}

export async function saveBrew(
  input: Omit<Brew, 'id' | 'createdAt' | 'updatedAt'>,
  id?: number,
) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  if (id) {
    await db.runAsync(
      `UPDATE brews SET bean_id = ?, bean_snapshot = ?, brewed_at = ?, desired_taste = ?, recipe = ?, tasting = ?, updated_at = ? WHERE id = ?`,
      input.beanId,
      JSON.stringify(input.bean),
      input.brewedAt,
      input.desiredTaste,
      JSON.stringify(input.recipe),
      JSON.stringify(input.tasting),
      now,
      id,
    );
    return id;
  }
  const result = await db.runAsync(
    `INSERT INTO brews
     (bean_id, bean_snapshot, brewed_at, desired_taste, recipe, tasting, source_brew_id, source_recommendation_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.beanId,
    JSON.stringify(input.bean),
    input.brewedAt,
    input.desiredTaste,
    JSON.stringify(input.recipe),
    JSON.stringify(input.tasting),
    input.sourceBrewId,
    input.sourceRecommendationId,
    now,
    now,
  );
  return result.lastInsertRowId;
}

export async function deleteBrew(id: number) {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM brews WHERE id = ?', id);
}

export async function saveRecommendation(
  baseBrewId: number,
  draft: Omit<Recommendation, 'id' | 'baseBrewId' | 'method' | 'createdAt'>,
): Promise<Recommendation> {
  const db = await dbPromise;
  const existing = await db.getFirstAsync<RecommendationRow>(
    `SELECT * FROM recommendations
     WHERE base_brew_id = ? AND condition_name = ? AND suggested_value = ?
     ORDER BY id DESC LIMIT 1`,
    baseBrewId,
    draft.conditionName,
    draft.suggestedValue,
  );
  if (existing) return mapRecommendation(existing);

  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO recommendations
     (base_brew_id, condition_name, before_value, suggested_value, reason, method, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    baseBrewId,
    draft.conditionName,
    draft.beforeValue,
    draft.suggestedValue,
    draft.reason,
    '규칙 기반',
    createdAt,
  );
  return {
    id: result.lastInsertRowId,
    baseBrewId,
    ...draft,
    method: '규칙 기반',
    createdAt,
  };
}

export async function getRecommendation(id: number): Promise<Recommendation | null> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<RecommendationRow>('SELECT * FROM recommendations WHERE id = ?', id);
  return row ? mapRecommendation(row) : null;
}
