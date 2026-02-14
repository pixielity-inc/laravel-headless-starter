/**
 * ==============================================================================
 * Search Engine Type
 * ==============================================================================
 * Type definition for supported search engines.
 *
 * @module types/search-engine
 * ==============================================================================
 */

/**
 * Supported search engines.
 *
 * @type {string}
 * @enum
 */
export type SearchEngine = 'meilisearch' | 'elasticsearch' | 'opensearch' | 'typesense' | 'algolia';
