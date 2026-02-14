/**
 * ==============================================================================
 * Mail Catcher Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for mail testing/catching tools.
 * Used for local development and testing environments only.
 *
 * @interface MailCatcherConfig
 * @module interfaces
 * ==============================================================================
 */

import { MailCatcher } from '@/types';

/**
 * Mail catcher configuration interface.
 *
 * This interface defines all configuration options for mail testing tools,
 * supporting multiple mail catchers for development and testing.
 *
 * @example
 * ```typescript
 * // Mailpit configuration
 * const mailpitConfig: MailCatcherConfig = {
 *   tool: "mailpit",
 *   version: "latest",
 *   smtpPort: 1025,
 *   uiPort: 8025
 * };
 *
 * // MailHog configuration
 * const mailhogConfig: MailCatcherConfig = {
 *   tool: "mailhog",
 *   version: "v1.0.1",
 *   smtpPort: 1025,
 *   uiPort: 8025
 * };
 * ```
 */
export interface MailCatcherConfig {
  /**
   * Mail catcher tool type.
   *
   * Determines which mail testing tool to deploy:
   * - "mailpit": Modern mail catcher with advanced features (recommended)
   * - "mailhog": Popular mail catcher with simple UI
   * - "mailtrap": Commercial mail testing service
   * - "none": No mail catcher (use real email service)
   *
   * @type {MailCatcher}
   * @default "mailpit" (local), "none" (production)
   * @example "mailpit", "mailhog", "mailtrap", "none"
   *
   * @comparison
   * Mailpit:
   * - Modern UI with dark mode
   * - Real-time updates via WebSocket
   * - Search and filtering
   * - API access
   * - Attachment preview
   * - HTML/Text rendering
   * - Active development
   *
   * MailHog:
   * - Simple and lightweight
   * - Basic UI
   * - API access
   * - No longer actively maintained
   * - Widely used
   *
   * Mailtrap:
   * - Commercial service
   * - Advanced features
   * - Team collaboration
   * - Email testing rules
   * - Requires account
   *
   * @recommendation
   * - Local/Dev: "mailpit" (best features, actively maintained)
   * - Legacy projects: "mailhog" (if already using)
   * - Production: "none" (use real email service)
   *
   * @note
   * - Mail catchers are for development/testing only
   * - Never use in production
   * - Use real email services in production (SES, SendGrid, etc.)
   */
  tool: MailCatcher;

  /**
   * Mail catcher version.
   *
   * Specifies the version of the mail catcher tool.
   * Available versions depend on the selected tool.
   *
   * @type {string}
   * @required true
   * @example
   * - Mailpit: "latest", "v1.20", "v1.19", "v1.18"
   * - MailHog: "latest", "v1.0.1"
   * - Mailtrap: "latest"
   *
   * @recommendation
   * - Use "latest" for development
   * - Pin specific version for consistency
   * - Mailpit: Use latest for new features
   * - MailHog: Use v1.0.1 (last stable release)
   */
  version: string;

  /**
   * SMTP port for receiving emails.
   *
   * Configure Laravel to send emails to this port.
   * The mail catcher captures all emails without actually sending them.
   *
   * @type {number}
   * @required true
   * @default 1025 (Mailpit, MailHog), 2525 (Mailtrap)
   * @standard Non-privileged port for SMTP testing
   *
   * @usage
   * ```env
   * MAIL_MAILER=smtp
   * MAIL_HOST=mailpit
   * MAIL_PORT=1025
   * MAIL_ENCRYPTION=null
   * MAIL_USERNAME=null
   * MAIL_PASSWORD=null
   * ```
   *
   * @example
   * ```typescript
   * smtpPort: 1025  // Standard for Mailpit/MailHog
   * ```
   *
   * @note
   * - No authentication required
   * - All emails are captured, not sent
   * - Use standard SMTP protocol
   * - No TLS/SSL needed for local development
   */
  smtpPort: number;

  /**
   * Web UI port for viewing captured emails.
   *
   * Access the mail catcher web interface to view all captured emails.
   * Provides email preview, search, and management features.
   *
   * @type {number}
   * @required true
   * @default 8025 (Mailpit, MailHog), 9000 (Mailtrap)
   *
   * @access
   * - Mailpit: http://localhost:8025 (or kubectl port-forward)
   * - MailHog: http://localhost:8025
   * - Mailtrap: http://localhost:9000
   *
   * @features
   * - View all captured emails
   * - Search emails by subject, sender, recipient
   * - Preview HTML and plain text versions
   * - View email headers and attachments
   * - Download emails (.eml format)
   * - REST API for automation
   * - Real-time updates (Mailpit)
   *
   * @example
   * ```typescript
   * uiPort: 8025  // Standard for Mailpit/MailHog
   * ```
   *
   * @note
   * - Only accessible in local/development environments
   * - Not deployed to production
   * - No authentication required (local only)
   * - Use kubectl port-forward for Kubernetes access
   */
  uiPort: number;
}
