import { z } from 'zod'

/** Per-message attachment limits. Data URLs are ~1.37× the raw byte size. */
export const MAX_FILES = 5
export const MAX_FILE_BYTES = 10_000_000
const MAX_DATAURL_CHARS = 15_000_000

/** What persists with a turn: an attachment's identity, not its bytes. The
 * bytes live as a Blob in the attachments store, keyed by this id (docs/adr/0005). */
export const AttachmentRef = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  mediaType: z.string().min(1).max(100),
})
export type AttachmentRef = z.infer<typeof AttachmentRef>

/** A user-attached file on the wire: the ref plus the data URL sent to the
 * model (trusted user input). The Blob is persisted on-device by id. */
export const Attachment = AttachmentRef.extend({
  dataUrl: z.string().max(MAX_DATAURL_CHARS),
})
export type Attachment = z.infer<typeof Attachment>

/** Human label for an attachment-only message (its filenames), used as the
 * conversation title and the transcript bubble when there's no text. */
export const attachmentsLabel = (files: Pick<Attachment, 'name'>[]): string =>
  files.map((f) => f.name).join(', ') || 'Attachment'
