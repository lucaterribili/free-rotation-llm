// Migration: per-chain routing strategy
// Created: 2026-11-05
//
// DOWN: reversible (drops the column)
//
// The routing strategy used to be one global setting that every chain obeyed.
// `profiles.strategy` lets each chain carry its own: NULL means "inherit the
// global strategy" (the previous behaviour, so existing installs are
// unchanged), a value overrides it for requests routed through that chain.

import type { Db } from '../types.js';

function hasColumn(db: Db, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some(col => col.name === column);
}

export function up(db: Db): void {
  if (!hasColumn(db, 'profiles', 'strategy')) {
    db.prepare('ALTER TABLE profiles ADD COLUMN strategy TEXT').run();
  }
}

export function down(db: Db): void {
  if (hasColumn(db, 'profiles', 'strategy')) {
    db.prepare('ALTER TABLE profiles DROP COLUMN strategy').run();
  }
}
