/**
 * ==============================================================================
 * Mail Catcher Type
 * ==============================================================================
 * Type definition for supported mail catcher/testing tools.
 *
 * @module types/mail-catcher
 * ==============================================================================
 */

/**
 * Supported mail catcher/testing tools.
 *
 * @type {string}
 * @enum
 */
export type MailCatcher = 'mailpit' | 'mailhog' | 'mailtrap' | 'none';
