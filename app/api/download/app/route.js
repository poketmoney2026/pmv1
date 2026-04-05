export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { statSync, createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'apps', 'app.apk');
  if (!existsSync(filePath)) {
    return new Response(JSON.stringify({ ok: false, message: 'File not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  const stat = statSync(filePath);
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream);
  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="app.apk"',
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
