# Generic Pool Decorator

The decorator we all know and love from generic-pool v2, now extracted into it's own module
Use it to transparently handle object acquisition for a function.

## install

```
npm install [--save] generic-pool-decorator
```

## Pooled function decoration

To create a pool decorator

```js
const decorator = require('generic-pool-decorator')
const pool; /* an instance of generic-pool /*

const pooled = decorator(pool)
```

`pooled` is now our decorator function we use to 'decorate' other functions that need to use
resources from the pool.

Let us start with a very basic function that calls a method on a resource that is managed by the pool.
It doesn't know how get resources or return them, or where they even come from (all good things).
```
const myFunc = function(resource, cb){
  resource.doSomething()
  cb()
}
```

we can then decorate that function using `pooled` from above:

```
const pooledFunc = pooled(myFunc)
```
and whenever we want to carry out the action defined in our original function we 
just call the `pooledFunc`

```
pooledFunc()
```

The decorator has taken care of fetching the resource from the pool and the returning it afterwards.


If we need to pass in any arguments, or our own callback to be executed once our function is done, that is possible too.

Starting with another simple function that uses an imaginary client to increment a counter by a variable amount and return the new count via a callback:
```js
const myCounterFunc = function(resource, someNumber, cb){
  const newTotal = resource.increment(someNumber)
  cb(null, newTotal)
}
```
we decorate it as before:
```js
const pooledFunc = pooled(myCounterFunc)
```
and now we can use the decorated function like so
```
const addThis = 12
const myCallback = function(err, newCount){
  // pretend we handle errors and this is actually
  // some async work..
  console.log(newCount)
}; 
pooledFunc(addThis, myCallback)
```

the decorator will fetch a resource from the pool, pass it to our original function along with the `addThis` and our `myCallback`. Once our original function executes it's `callback`, the decorator returns the resource to the pool, and then executes our callback with the value from the original function. 


Here some more complex examples from the previous docs:

```js
const privateFn = function(client, arg, cb) {
    // Do something with the client and arg. Client is auto-released when cb is called
    cb(null, arg);
}
const publicFn = pooled(privateFn);
```

Keeping both private and public versions of each function allows for pooled
functions to call other pooled functions with the same member. This is a handy
pattern for database transactions:

```js

const privateBottom = function(client, arg, cb) {
    //Use client, assumed auto-release
}

const publicBottom = pooled(privateBottom);

const privateTop = function(client, cb) {
    // e.g., open a database transaction
    privateBottom(client, "arg", function(err, retVal) {
        if(err) { return cb(err); }
        // e.g., close a transaction
        cb();
    });
}
const publicTop = pooled(privateTop);
```
