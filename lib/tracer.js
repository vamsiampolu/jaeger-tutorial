const { initTracer } = require('jaeger-client')

module.exports = createTracer

function createTracer (serviceName) {
  const sampler = { type: 'const', param: 1 }

  // collectorEndpoint: 'http://xxx.xxx.xxx'
  const reporter = { logSpans: true, agentHost: 'jaeger', agentPort: 6832 }

  const config = { serviceName, sampler, reporter }

  const logger = { info: msg => console.log('INFO', msg), error: msg => console.error('ERROR', msg) }

  return initTracer(config, { logger })
}
