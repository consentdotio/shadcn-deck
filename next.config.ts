import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		// Forward browser logs to the terminal for easier debugging
		browserDebugInfoInTerminal: true,

		// Enable new caching and pre-rendering behavior
		cacheComponents: true, // will be renamed to cacheComponents in Next.js 16

		// Activate new client-side router improvements
		clientSegmentCache: true,

		// Enable support for `global-not-found`, which allows you to more easily define a global 404 page.
		globalNotFound: true,

		// Enable persistent caching for the turbopack dev server and build.
		turbopackFileSystemCacheForDev: true,

		inlineCss: true,
	},
};

export default nextConfig;
