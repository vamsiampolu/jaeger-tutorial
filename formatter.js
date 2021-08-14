const Koa = require('koa')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')

const initTracer = require('./lib/tracer')

const serviceName = 'format-service'
const port = 3001

const tracer = initTracer(serviceName)

async function isFormat(ctx, next) { 
  console.log('URL', ctx.url);
  console.log('METHOD', ctx.method);

  if (ctx.url.includes('/format') && ctx.method === 'GET') {
    await next();
  }
}

function format (ctx) {
  const { headers, query } = ctx

  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, headers)
  const span = tracer.startSpan('http_server', {
    childOf: parentSpanContext,
    tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER }
  })

  const helloTo = query.helloTo
  const greeting = span.getBaggageItem('greeting') || 'Hello';

  span.log({
    event: 'format',
    value: helloTo
  })

  span.finish()
  ctx.body = `${greeting} ${helloTo}`
  ctx.status = 200
}

const app = new Koa()
app.use(isFormat).use(format)

app.listen(port, () => {
  console.log('Formatter app listening on port ' + port)
})
