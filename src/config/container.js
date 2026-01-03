/**
 * Dependency Injection Container
 * 
 * Central registry for managing all application dependencies.
 * Provides:
 * - Inversion of Control (IoC)
 * - Dependency Injection
 * - Lifecycle management (Singleton/Transient)
 * - Lazy instantiation
 * 
 * @module Container
 */

const logger = require('../shared/utils/logger');

/**
 * Dependency Injection Container Class
 * 
 * Manages the creation and lifecycle of all application dependencies.
 * Supports both singleton and transient (new instance each time) patterns.
 */
class Container {
  constructor() {
    /**
     * Map of registered dependencies
     * @private
     * @type {Map<string, {factory: Function, options: Object}>}
     */
    this.dependencies = new Map();

    /**
     * Cache for singleton instances
     * @private
     * @type {Map<string, any>}
     */
    this.singletons = new Map();

    /**
     * Flag to track if container has been initialized
     * @private
     */
    this.initialized = false;
  }

  /**
   * Register a dependency in the container
   * 
   * @param {string} name - Unique identifier for the dependency
   * @param {Function} factory - Factory function that creates the instance
   * @param {Object} options - Registration options
   * @param {boolean} [options.singleton=true] - Whether to cache as singleton
   * @param {Array<string>} [options.dependencies=[]] - List of dependency names
   * 
   * @example
   * container.register('animeService', (c) => {
   *   return new AnimeService(
   *     c.resolve('animeRepository'),
   *     c.resolve('animeAdapter')
   *   );
   * }, { singleton: true });
   */
  register(name, factory, options = {}) {
    if (typeof name !== 'string' || !name) {
      throw new Error('Dependency name must be a non-empty string');
    }

    if (typeof factory !== 'function') {
      throw new Error(`Factory for '${name}' must be a function`);
    }

    const config = {
      factory,
      options: {
        singleton: options.singleton !== undefined ? options.singleton : true,
        dependencies: options.dependencies || [],
        ...options
      }
    };

    this.dependencies.set(name, config);
    logger.debug(`[Container] Registered: ${name} (singleton: ${config.options.singleton})`);
  }

  /**
   * Resolve a dependency from the container
   * 
   * @param {string} name - Name of the dependency to resolve
   * @returns {any} The resolved dependency instance
   * @throws {Error} If dependency is not registered
   * 
   * @example
   * const animeService = container.resolve('animeService');
   */
  resolve(name) {
    if (!this.dependencies.has(name)) {
      throw new Error(`Dependency '${name}' is not registered in the container`);
    }

    const config = this.dependencies.get(name);

    if (config.options.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Create new instance
    try {
      logger.debug(`[Container] Resolving: ${name}`);
      const instance = config.factory(this);

      // Cache singleton
      if (config.options.singleton) {
        this.singletons.set(name, instance);
        logger.debug(`[Container] Cached singleton: ${name}`);
      }

      return instance;
    } catch (error) {
      logger.error(`[Container] Failed to resolve '${name}': ${error.message}`);
      throw new Error(`Failed to resolve dependency '${name}': ${error.message}`);
    }
  }

  /**
   * Create a new instance (force transient, ignore singleton cache)
   * 
   * @param {string} name - Name of the dependency
   * @returns {any} A new instance of the dependency
   */
  create(name) {
    if (!this.dependencies.has(name)) {
      throw new Error(`Dependency '${name}' is not registered in the container`);
    }

    const config = this.dependencies.get(name);
    logger.debug(`[Container] Creating new instance: ${name}`);
    return config.factory(this);
  }

  /**
   * Check if a dependency is registered
   * 
   * @param {string} name - Name of the dependency
   * @returns {boolean} True if registered
   */
  has(name) {
    return this.dependencies.has(name);
  }

  /**
   * Clear all singleton instances
   */
  clearSingletons() {
    this.singletons.clear();
    logger.debug('[Container] Cleared all singleton instances');
  }

  /**
   * Reset the entire container
   */
  reset() {
    this.dependencies.clear();
    this.singletons.clear();
    this.initialized = false;
    logger.debug('[Container] Container reset');
  }

  /**
   * Get all registered dependency names
   * 
   * @returns {string[]} Array of dependency names
   */
  getRegistered() {
    return Array.from(this.dependencies.keys());
  }
}

// Load all modules into the container
const container = new Container();
const loadModules = require('./loaders');
loadModules(container);


// Initialize and Shutdown Methods

/**
 * Initialize the container and verify all critical dependencies
 * Call this during application startup
 * 
 * @returns {Promise<void>}
 */
container.initialize = async function() {
  if (this.initialized) {
    logger.warn('[Container] Already initialized, skipping...');
    return;
  }

  try {
    logger.info('[Container] Starting initialization...');

    // Verify critical dependencies are resolvable
    const criticalDeps = [
      'prisma',
      'httpClient',
      'anilistAnimeClient',
      'animeAdapter',
      'animeRepository',
      'animeService',
      'animeController'
    ];

    for (const dep of criticalDeps) {
      this.resolve(dep);
      logger.debug(`[Container] ✓ ${dep} ready`);
    }

    this.initialized = true;
    logger.info('[Container] Initialization complete ✓');
    logger.info(`[Container] Registered dependencies: ${this.getRegistered().join(', ')}`);

  } catch (error) {
    logger.error(`[Container] Initialization failed: ${error.message}`);
    throw new Error(`Container initialization failed: ${error.message}`);
  }
};

/**
 * Gracefully shutdown the container
 * Cleanup resources (e.g., close database connections)
 * 
 * @returns {Promise<void>}
 */
container.shutdown = async function() {
  try {
    logger.info('[Container] Starting graceful shutdown...');

    // Disconnect Prisma if it was initialized
    if (this.singletons.has('prisma')) {
      const prisma = this.singletons.get('prisma');
      if (prisma && typeof prisma.$disconnect === 'function') {
        await prisma.$disconnect();
        logger.info('[Container] Prisma disconnected');
      }
    }

    this.clearSingletons();
    logger.info('[Container] Shutdown complete ✓');
  } catch (error) {
    logger.error(`[Container] Shutdown error: ${error.message}`);
    throw error;
  }
};

module.exports = container;