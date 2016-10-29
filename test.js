'use strict'

const tap = require('tap')
const decorator = require('./')

tap.test('pooled decorator should call acquire and release', function (t) {
  // FIXME: assertion count should probably be replaced with t.plan?
  let assertionCount = 0

  const pool = {
    acquire: function () {
      return Promise.resolve({id: 1})
    },
    release: function () {
      t.equal(assertionCount, 3)
    }
  }

  const pooled = decorator(pool)

  const userFn = function (client, cb) {
    t.equal(typeof client.id, 'number')
    assertionCount += 2
    cb()
  }

  const pooledFn = pooled(userFn)

  assertionCount += 1

  pooledFn(function (err) {
      // FIXME: what is even happening in this block?
    if (err) { throw err }
    t.ok(true)
    assertionCount += 1
    t.end()
  })
})

tap.test('pooled decorator should pass arguments and return values', function (t) {
    // FIXME: assertion count should probably be replaced with t.plan?
  let assertionCount = 0

  const pool = {
    acquire: function () {
      return Promise.resolve({id: 1})
    },
    release: function () {
    }
  }

  const pooled = decorator(pool)

  const pooledFn = pooled(function (client, arg1, arg2, cb) {
    t.equal(arg1, 'First argument')
    t.equal(arg2, 'Second argument')
    assertionCount += 2
    cb(null, 'First return', 'Second return')
  })

  pooledFn('First argument', 'Second argument', function (err, retVal1, retVal2) {
    if (err) { throw err }
    t.equal(retVal1, 'First return')
    t.equal(retVal2, 'Second return')
    assertionCount += 2
    t.equal(assertionCount, 4)
    t.end()
  })
})

// FIXME:  I'm not really sure what this testing...
tap.test('pooled decorator should allow undefined callback', function (t) {
  let assertionCount = 0

  const pool = {
    acquire: function () {
      return Promise.resolve({id: 1})
    },
    release: function () {
      t.equal(assertionCount, 1)
      t.end()
    }
  }

  const pooled = decorator(pool)

  const pooledFn = pooled(function (client, arg, cb) {
    t.equal(arg, 'Arg!')
    assertionCount++
    cb()
  })

  pooledFn('Arg!')
})

tap.test('pooled decorator should forward pool acquire timeout errors', function (t) {
  let assertionCount = 0

  const pool = {
    acquire: function () {
      return Promise.reject(new Error('ResourceRequest timed out'))
    }
  }

  const pooled = decorator(pool)

  const pooledFn = pooled(function (resource, cb) {
    cb()
  })

  pooledFn(function (err, obj) {
    t.match(err, /ResourceRequest timed out/)
    assertionCount++
    t.equal(assertionCount, 1)
    t.end()
  })
})
