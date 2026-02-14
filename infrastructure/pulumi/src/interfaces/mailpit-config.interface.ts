/**
 * ==============================================================================
 * Mailpit Configuration Interface
 * ==============================================================================
 * Defines the configuration structure for Mailpit email testing tool.
 * Mailpit captures all outgoing emails for testing without actually sending them.
 * Only used in local/development environments.
 *
 * @interface MailpitConfig
 * @module interfaces
 * ==============================================================================
 */

/**
 * Mailpit email testing configuration interface.
 *
 * Mailpit is a local email testing tool that:
 * - Captures all outgoing emails
 * - Provides a web UI to view emails
 * - Supports SMTP protocol
 * - No actual email sending
 * - Perfect for development and testing
 *
 * @example
 * ```typescript
 * const mailpitConfig: MailpitConfig = {
 *   smtpPort: 1025,
 *   uiPort: 8025
 * };
 * ```
 *
 * @note Only enabled in local/development environments.
 *       Production should use real mail services (SES, SendGrid, Postmark).
 */
export interface MailpitConfig {
  /**
   * SMTP server port for receiving emails.
   *
   * Configure Laravel to send emails to this port.
   * Mailpit captures all emails without actually sending them.
   *
   * @type {number}
   * @default 1025
   * @standard Non-privileged port for SMTP testing
   * @usage
   * ```env
   * MAIL_MAILER=smtp
   * MAIL_HOST=mailpit
   * MAIL_PORT=1025
   * MAIL_ENCRYPTION=null
   * ```
   *
   * @note
   * - Only used in local/development environments
   * - Production should use real mail services (SES, SendGrid, Postmark)
   * - No authentication required
   * - All emails are captured, not sent
   */
  smtpPort: number;

  /**
   * Web UI port for viewing captured emails.
   *
   * Access the Mailpit web interface to view all captured emails.
   * Provides email preview, search, and API access.
   *
   * @type {number}
   * @default 8025
   * @access http://localhost:8025 (or kubectl port-forward)
   * @features
   * - View all captured emails
   * - Search emails by subject, sender, recipient
   * - Preview HTML and plain text versions
   * - View email headers and attachments
   * - REST API for automation
   * - Real-time updates via WebSocket
   *
   * @note
   * - Only accessible in local/development environments
   * - Not deployed to production
   * - No authentication required (local only)
   */
  uiPort: number;
}
