import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/mcp', { recursive: true });
await copyFile('index.html', 'dist/mcp/index.html');
