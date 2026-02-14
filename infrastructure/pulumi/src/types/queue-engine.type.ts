/**
 * ==============================================================================
 * Queue Engine Type
 * ==============================================================================
 * Type definition for supported queue/message broker engines.
 *
 * @module types/queue-engine
 * ==============================================================================
 */

/**
 * Supported queue/message broker engines.
 *
 * @type {string}
 * @enum
 */
export type QueueEngine = 'rabbitmq' | 'kafka' | 'beanstalkd' | 'redis' | 'sqs';
