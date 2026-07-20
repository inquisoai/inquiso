#!/usr/bin/env node
// Serves the demo portals (demo/portals) on http://localhost:8788 with zero
// dependencies — the controlled environment for the MemoryAgent demo.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const ROOT = join(process.cwd(), 'demo', 'portals')
const PORT = Number(process.env.PORT ?? 8788)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  // Resolve inside ROOT only; directory requests get their index.html.
  let path = normalize(join(ROOT, decodeURIComponent(url.pathname)))
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden')
    return
  }
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html')
  if (!existsSync(path)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
  createReadStream(path).pipe(res)
})

server.listen(PORT, () => {
  console.log(`Demo portals: http://localhost:${PORT}/`)
  console.log(`  invoice portal: http://localhost:${PORT}/invoice/`)
  console.log(`  expense portal: http://localhost:${PORT}/expense/`)
})
