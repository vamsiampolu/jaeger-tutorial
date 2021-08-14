const initTracer = require('../trace')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')
const pkg = require('../../../package.json')

module.exports = traceMiddleware

function traceMiddleware () {
  return async function trace (ctx, next) {
    const { header, method, path } = ctx

    const tracer = initTracer(`${pkg.name}-${pkg.version}`)
    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, header)

    ctx.req.span = tracer.startSpan(`${method}: ${path}`, { childOf: parentSpanContext })

    ctx.req.on('finish', () => {
      const { status } = ctx
      ctx.req.span.setTag(Tags.HTTP_STATUS_CODE, status)
      ctx.req.span.setTag(Tags.ERROR, status >= 400)
      ctx.req.span.finish()
    })

    await next()
  }
}
