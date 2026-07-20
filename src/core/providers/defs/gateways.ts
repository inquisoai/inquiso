import { compatibleDef } from './compatible'

/** Built-in gateways: one host + one key each, fronting hundreds of models
 * across providers. This is how "bring any model" works without a per-model
 * adapter — you name the model id, the gateway routes it. */
export const openrouter = compatibleDef({
  id: 'openrouter',
  label: 'OpenRouter',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultModel: 'openai/gpt-4o-mini',
  dataUse: 'Sent to openrouter.ai with your OpenRouter key; routed to whichever model id you name.',
  keyUrl: 'https://openrouter.ai/keys',
})

export const vercelGateway = compatibleDef({
  id: 'vercel-gateway',
  label: 'Vercel AI Gateway',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  defaultModel: 'openai/gpt-4o-mini',
  dataUse:
    'Sent to ai-gateway.vercel.sh with your Vercel AI Gateway key; routed to the model id you name.',
  keyUrl: 'https://vercel.com/docs/ai-gateway',
})

export const gatewayDefs = [openrouter, vercelGateway]
