const initTracer = require('./lib/tracer')
const { name, version } = require('./package.json')

const serviceName = [name, version].join('-')

const tracer = initTracer(serviceName)

const printHello = (ctx, helloStr) => {
  ctx = { span: tracer.startSpan('print-hello', { childOf: ctx.span }) }

  console.log(helloStr)

  ctx.span.log({ event: 'print-string' })
  ctx.span.finish()
}

const formatString = (ctx, helloTo) => {
  ctx = { span: tracer.startSpan('format-string', { childOf: ctx.span }) }

  const str = `Hello ${helloTo}`

  ctx.span.log({ event: 'format-string', value: str })
  ctx.span.finish()

  return str
}

const sayHello = helloTo => {
  const span = tracer.startSpan('say-hello')
  const ctx = { span }

  ctx.span.setTag('hello-to', helloTo)

  const str = formatString(span, helloTo)
  printHello(ctx, str)

  ctx.span.finish()
}

sayHello('Dark')
tracer.close(() => process.exit())
