// Copyright (C) 2026 Piovium Labs
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { VERSIONS, type Version } from "@gi-tcg/core";
import analyzeResult from "@gi-tcg/data-code-analyzer";
import type { CardPool } from "./deck";

/**
 * 某版本下"能被合法生成"的定义集合，基于 data-code-analyzer 的静态依赖图。
 *
 * 未写 `since` 的状态 / 衍生牌按最早版本注册，出现在每个旧版本的数据里，
 * 但引用它们的母卡可能只在更新的版本才有；场景生成器不能把这类实体放进旧版本的状态树。
 */

interface VersionedDeps {
  readonly since: Version;
  readonly until: Version | null;
  readonly deps: readonly number[];
}

const versionIndex = new Map<string, number>(VERSIONS.map((v, i) => [v, i]));
const idx = (v: Version) => versionIndex.get(v)!;

const defsById = new Map<number, VersionedDeps[]>();
/** 全局被引用过的 id（任一版本的任一定义引用了它） */
const referenced = new Set<number>();
const commonIds: number[] = [];

for (const entry of analyzeResult) {
  if (/^\s*reserved;/m.test(entry.code)) {
    continue;
  }
  const since = entry.code.match(/^\s*since "(v[\d.]+)";/m)?.[1];
  const until = entry.code.match(/^\s*until "(v[\d.]+)";/m)?.[1];
  const list = defsById.get(entry.id) ?? [];
  list.push({
    since: (since ?? VERSIONS[0]) as Version,
    until: (until ?? null) as Version | null,
    deps: entry.dependencies,
  });
  defsById.set(entry.id, list);
  for (const d of entry.dependencies) {
    if (d !== entry.id) {
      referenced.add(d);
    }
  }
  if (entry.location.filename.endsWith("commons.gts")) {
    commonIds.push(entry.id);
  }
}

/** 与 core `resolveOfficialVersion` 同一规则；该版本不存在此定义时返回 null */
function activeDeps(id: number, version: Version): readonly number[] | null {
  const defs = defsById.get(id);
  if (!defs) {
    return null;
  }
  const since = defs.find((d) => d.until === null);
  if (!since || idx(since.since) > idx(version)) {
    return null;
  }
  const until = defs
    .filter((d) => d.until !== null && idx(d.until) >= idx(version))
    .sort((a, b) => idx(a.until!) - idx(b.until!));
  return (until[0] ?? since).deps;
}

const reachableCache = new WeakMap<CardPool, ReadonlySet<number>>();
function reachableSet(pool: CardPool): ReadonlySet<number> {
  const cached = reachableCache.get(pool);
  if (cached) {
    return cached;
  }
  const roots = [
    ...commonIds,
    ...pool.characters.map((c) => c.id),
    ...pool.deckCards.map((c) => c.id),
    ...[...pool.talents.values()].flat().map((c) => c.id),
  ];
  const seen = new Set<number>();
  const stack = [...roots];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    for (const d of activeDeps(id, pool.version) ?? []) {
      stack.push(d);
    }
  }
  reachableCache.set(pool, seen);
  return seen;
}

/**
 * 该版本的对局里有没有途径产生这个定义。
 * 依赖图里从未被任何定义引用的 id（引擎直接创建、或分析器没追踪到）一律放行。
 */
export function isReachable(id: number, pool: CardPool): boolean {
  return !referenced.has(id) || reachableSet(pool).has(id);
}
