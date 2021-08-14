**Step 1: Create a Tracer**

A tracer needs a:

  Config:
    * serviceName
    * sampler
    * reporter

  Options:
    * logger
    * metrics

The `options` are optional, but I recommend providing a logger.

---

A trace is a directed acyclic graph (DAG) which means that it has a definite start and end nodes with directed edges establishing the relationship between each parent and child.

Each node in the graph is a `Span`, each edge (relationship) is known as a `SpanReference`. A `SpanReference` consists of a `ReferenceType` and a `SpanContext`.

For a parent span to finish, all child spans need to finish.

A `SpanContext` is an immutable thread safe part of a span that can be used to establish a reference or propogated over the wire.

A `SpanContext` can be `Inject`ed and `Extract`ed from a process.

---

**Step 2: Span**

* A tracer can create a span.

* A span has an operation name.

* A span ends when `finish` is called.

---

**Step 3: Annotating a Span**

A Span can be annotated with `Tags` and `Logs`.

Tags are metadata that can be added to a span. A Tag must not be time sensitive data.
It should remain the same for the entire duration of the span.

A log is an event that is associated with a clear timestamp.

OpenTracing API exposes a `span.log` method, each log must contain an `event` field.

---

**Step 4: Nested Spans**

* A span can be a child or a parent of another span.

* To declare a span as a child of another span, use:

```js
tracer.startSpan('<span-name>', { childOf: rootSpan });
```

---

**Create a tracer**

```js
const { initTracer } = require('jaeger-client')

module.exports = createTracer

function createTracer (serviceName) {
  const sampler = { type: 'const', param: 1 }

  // collectorEndpoint: 'http://xxx.xxx.xxx'
  // agentHost: 'xxx.xxx.xxx',
  // agentPort: 6832
  const reporter = { logSpans: true }

  const config = { serviceName, sampler, reporter }

  const logger = { info: msg => console.log('INFO', msg), error: msg => console.error('ERROR', msg) }

  return initTracer(config, { logger })
}
```

---

**Use a tracer for a function**

```js
const tracer = initTracer(serviceName)

const sayHello = helloTo => {
  const span = tracer.startSpan('say-hello')

  span.setTag('hello-to', helloTo)

  const helloStr = `Hello, ${helloTo}!`
  span.log({ event: 'string-format', value: helloStr })

  console.log(helloStr)
  span.log({ event: 'print-string' })

  span.finish()
}

sayHello('Dark')
tracer.close(() => process.exit())
```

---

**Child Spans**

```js
const tracer = initTracer(serviceName)

const printHello = (rootSpan, helloStr) => {
  const span = tracer.startSpan('print-hello', { childOf: rootSpan });
  console.log(helloStr)
  span.log({ event: 'print-string' })
  span.finish();
}

const formatString = (rootSpan, helloTo) => {
  const span = tracer.startSpan('format-string', { childOf: rootSpan });
  const str = `Hello ${helloTo}`
  span.log({ event: 'format-string', value: str })
  span.finish();
  return str
}

const sayHello = helloTo => {
  const span = tracer.startSpan('say-hello')
  span.setTag('hello-to', helloTo)
  const str = formatString(span, helloTo)
  printHello(span, str)
  span.finish();
}

sayHello('Dark')
tracer.close(() => process.exit())
```

---
