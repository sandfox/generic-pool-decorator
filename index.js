'use strict'

/**
 * Creates a decarator for the pool instance
 * @param  {[type]} pool [description]
 * @return {[type]}      [description]
 */
module.exports = function createCallbackDecorator (pool) {
  /**
   * Decorates a function to use an acquired resource from the object pool when called.
   *
   * @param {Function} decorated
   *   The decorated function, accepting a resource as the first argument and
   *   (optionally) a callback as the final argument.
   *
   * @param {Number} priority
   *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
   *   of the caller if there are no available resources.  Lower numbers mean higher
   *   priority.
   */
  return function pooled (decorated, priority) {
    return function () {
      // stop v8 from de-optimising
      const callerArgs = new Array(arguments.length)
      for (let i = 0; i < callerArgs.length; ++i) {
        callerArgs[i] = arguments[i]
      }
      const callerCallback = callerArgs[callerArgs.length - 1]
      const callerHasCallback = typeof callerCallback === 'function'

      pool.acquire(priority)
      .then(_onAcquire)
      .catch(function (err) {
        // NOTE: errors can silently disappear here if no callback...
        if (callerHasCallback) {
          callerCallback(err)
        }
      })

      function _onAcquire (resource) {
        function _wrappedCallback () {
          pool.release(resource)
          if (callerHasCallback) {
            // stop v8 from de-optimising
            const args = new Array(arguments.length)
            for (let i = 0; i < args.length; ++i) {
              args[i] = arguments[i]
            }
            callerCallback.apply(null, args)
          }
        }

        const args = [resource].concat(Array.prototype.slice.call(callerArgs, 0, callerHasCallback ? -1 : undefined))
        args.push(_wrappedCallback)

        decorated.apply(null, args)
      }
    }
  }
}
