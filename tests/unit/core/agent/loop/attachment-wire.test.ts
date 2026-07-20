import http from 'node:http'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import { describe, expect, it } from 'vitest'
import { userMessage } from '@/core/agent/loop/message'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC'

describe('attachments reach the AI SDK message stream', () => {
  it('builds a multimodal message with a file part', () => {
    const msg = userMessage('Describe this.', [
      { id: 'a1', name: 'red.png', mediaType: 'image/png', dataUrl: PNG },
    ])
    expect(Array.isArray(msg.content)).toBe(true)
    const parts = msg.content as Array<{ type: string }>
    expect(parts.map((p) => p.type)).toEqual(['text', 'file'])
  })

  it('omits the text part for an attachment-only message', () => {
    const msg = userMessage('', [
      { id: 'a1', name: 'red.png', mediaType: 'image/png', dataUrl: PNG },
    ])
    const parts = msg.content as Array<{ type: string }>
    expect(parts.map((p) => p.type)).toEqual(['file'])
  })

  it('serializes the file bytes onto the outbound request', async () => {
    let body = ''
    const server = http.createServer((req, res) => {
      req.on('data', (c) => {
        body += c
      })
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'text/event-stream' })
        res.write('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n')
        res.write('data: [DONE]\n\n')
        res.end()
      })
    })
    await new Promise<void>((r) => server.listen(0, () => r()))
    const port = (server.address() as { port: number }).port

    const provider = createOpenAICompatible({
      name: 'mock',
      baseURL: `http://localhost:${port}/v1`,
      apiKey: 'test',
    })
    const messages = [
      userMessage('Describe this.', [
        { id: 'a1', name: 'red.png', mediaType: 'image/png', dataUrl: PNG },
      ]),
    ]
    const result = streamText({ model: provider('mock-vision'), messages })
    for await (const _ of result.textStream) {
      // drain the stream so the request completes
    }
    server.close()

    expect(body).toContain('iVBORw0KGgoAAAANSUhEUg')
    expect(body).toContain('image_url')
  })
})
