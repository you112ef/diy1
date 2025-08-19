import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import type { ServerBuild } from '@remix-run/cloudflare';
import * as build from '../build/server/index.js';

export const onRequest = createPagesFunctionHandler({
	build: () => build as unknown as ServerBuild,
	getLoadContext: (context) => context.env,
	mode: process.env.NODE_ENV,
});
