module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,html,ttf,png,ico,json}'
	],
	swDest: 'dist/web/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	maximumFileSizeToCacheInBytes: 5242880 // 5MB
};