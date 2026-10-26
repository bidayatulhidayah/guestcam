import { defineString } from 'firebase-functions/params';

export const REGION = 'asia-southeast1';

/**
 * Public site address for links built by functions (exports, emails).
 * The ONE domain setting on the server side (AGENTS.md, Domain).
 */
export const PUBLIC_BASE_URL = defineString('PUBLIC_BASE_URL', {
  default: '',
  description: 'Public site address, e.g. https://<site>.web.app (no trailing slash)',
});
