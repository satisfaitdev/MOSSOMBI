import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const FRONTEND_APP_DIR = path.resolve(process.cwd(), '..', 'Frontend client', 'app');

function isGroupFolder(name: string) {
  return name.startsWith('(') && name.endsWith(')');
}

function isRoutableFile(name: string) {
  return /\.(tsx|ts|jsx|js)$/.test(name);
}

function shouldIgnoreName(name: string) {
  return name.startsWith('_') || name.startsWith('+') || name.startsWith('.');
}

async function walkRoutes(dir: string, segments: string[]): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const e of entries) {
    const name = e.name;
    if (shouldIgnoreName(name)) continue;

    const full = path.join(dir, name);

    if (e.isDirectory()) {
      const nextSegments = isGroupFolder(name) ? segments : [...segments, name];
      out.push(...(await walkRoutes(full, nextSegments)));
      continue;
    }

    if (!e.isFile()) continue;
    if (!isRoutableFile(name)) continue;

    const base = name.replace(/\.(tsx|ts|jsx|js)$/, '');
    if (base === '_layout' || base === '+not-found') continue;

    const fileSegments = base === 'index' ? segments : [...segments, base];
    const route = `/${fileSegments.filter(Boolean).join('/')}`.replace(/\/+/g, '/');
    out.push(route);
  }

  return out;
}

export async function GET() {
  try {
    const routes = await walkRoutes(FRONTEND_APP_DIR, []);
    const unique = Array.from(new Set(routes)).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ success: true, data: unique }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Impossible de lister les routes' },
      { status: 500 }
    );
  }
}
