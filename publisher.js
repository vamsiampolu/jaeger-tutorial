const Koa = require('koa')
const opentracing = require('opentracing')
const initTracer = require('./lib/tracer')

const { Tags, FORMAT_HTTP_HEADERS } = opentracing

const serviceName = 'publisher'
const tracer = initTracer(serviceName)
const port = 3002

async function isPublish (ctx, next)  {
  console.log('URL', ctx.url);
  console.log('Method', ctx.method);
  if (ctx.url.includes('/publish') && ctx.method === 'GET') 
     await next();
}

async function publish (ctx) {
  const { headers, query } = ctx
  console.log('QUERY', query);
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, headers)
  const span = tracer.startSpan('http_server', {
    childOf: parentSpanContext,
    tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER }
  })

  const { helloStr: str } = query

  span.log({
    event: 'publish',
    value: str
  })

  console.log(str)

  span.finish()

  ctx.body = 'Published'
  ctx.status = 200
}

const app = new Koa()
app.use(isPublish).use(publish)

app.listen(port, () => {
  console.log('Publisher app listening on port ' + port)
})
