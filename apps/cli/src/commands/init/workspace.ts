import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkspacePackage } from '@envctrl/types';

/**
 * Traverses up from `startDir` to find the workspace root.
 *
 * A directory is considered the workspace root if it contains
 * `pnpm-workspace.yaml` or a `package.json` with a `workspaces` field.
 * Falls back to `startDir` if no root is found.
 */
export async function findWorkspaceRoot(startDir: string): Promise<string> {
  let dir = startDir;

  while (true) {
    try {
      await fs.access(path.join(dir, 'pnpm-workspace.yaml'));
      return dir;
    } catch {}

    try {
      const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
      const pkg = JSON.parse(raw) as { workspaces?: unknown };
      if (pkg.workspaces) return dir;
    } catch {}

    const parent = path.dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

/**
 * Reads workspace package glob patterns from `pnpm-workspace.yaml` or
 * the `workspaces` field in `package.json`.
 */
async function readWorkspacePatterns(workspaceRoot: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
    const patterns: string[] = [];
    let inPackages = false;

    for (const line of raw.split('\n')) {
      if (/^packages\s*:/.test(line)) {
        inPackages = true;
        continue;
      }
      if (inPackages) {
        const match = line.match(/^\s+-\s+['"]?([^'"]+)['"]?/);
        if (match) {
          patterns.push(match[1].trim());
        } else if (line.trim() && !line.startsWith('#')) {
          break;
        }
      }
    }

    if (patterns.length > 0) return patterns;
  } catch {}

  try {
    const raw = await fs.readFile(path.join(workspaceRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as {
      workspaces?: string[] | { packages: string[] };
    };
    if (Array.isArray(pkg.workspaces)) return pkg.workspaces;
    if (pkg.workspaces?.packages) return pkg.workspaces.packages;
  } catch {}

  return [];
}

/**
 * Expands a single workspace glob pattern (supporting one trailing `*`) into
 * matching subdirectory paths under `workspaceRoot`.
 */
async function expandPattern(workspaceRoot: string, pattern: string): Promise<string[]> {
  if (!pattern.includes('*')) {
    return [path.resolve(workspaceRoot, pattern)];
  }

  const starIndex = pattern.indexOf('*');
  const baseRelative = pattern.slice(0, starIndex).replace(/\/$/, '');
  const suffix = pattern.slice(starIndex + 1);
  const baseDir = path.resolve(workspaceRoot, baseRelative);

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => path.join(baseDir, e.name + suffix));
  } catch {
    return [];
  }
}

/**
 * Scans `workspaceRoot` for all packages by expanding workspace glob patterns
 * and filtering directories that contain a `package.json`.
 */
export async function scanWorkspacePackages(workspaceRoot: string): Promise<WorkspacePackage[]> {
  const patterns = await readWorkspacePatterns(workspaceRoot);
  const packages: WorkspacePackage[] = [];

  for (const pattern of patterns) {
    const dirs = await expandPattern(workspaceRoot, pattern);

    for (const dir of dirs) {
      try {
        const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
        const pkg = JSON.parse(raw) as { name?: string };
        if (pkg.name) {
          packages.push({
            name: pkg.name,
            path: path.relative(workspaceRoot, dir),
          });
        }
      } catch {}
    }
  }

  return packages;
}
