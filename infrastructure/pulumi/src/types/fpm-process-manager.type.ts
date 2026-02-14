/**
 * ==============================================================================
 * FPM Process Manager Type
 * ==============================================================================
 * Type definition for PHP-FPM process managers.
 *
 * @module types/fpm-process-manager
 * ==============================================================================
 */

/**
 * PHP-FPM process managers.
 *
 * @type {string}
 * @enum
 */
export type FPMProcessManager = 'dynamic' | 'static' | 'ondemand';
