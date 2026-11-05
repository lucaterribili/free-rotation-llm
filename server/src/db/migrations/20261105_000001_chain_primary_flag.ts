// Migration: per-entry "primary" flag on chains
// Created: 2026-11-05
//
// DOWN: reversible (drops the columns)
//
// Under the 'primary-first' strategy the chain is split in two pools: entries
// flagged is_primary form the primary pool, every request cycles through it
// first (in chain order), and only then falls back to the unflagged entries.
// Both chain tables get the flag: profile_models (named chains / auto:<name>)
// and fallback_config (installs without profiles).

import type { Db } from '../types.js';

const TABLES = ['profile_models', 'fallback_config'] as const;

function hasColumn(db: Db, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some(col => col.name === column);
}

export function up(db: Db): void {
  for (const table of TABLES) {
    if (!hasColumn(db, table, 'is_primary')) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0`).run();
    }
  }
}

export function down(db: Db): void {
  for (const table of TABLES) {
    if (hasColumn(db, table, 'is_primary')) {
      db.prepare(`ALTER TABLE ${table} DROP COLUMN is_primary`).run();
    }
  }
}
