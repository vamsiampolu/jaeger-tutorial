const axios = require('axios');
const { Tags, FORMAT_HTTP_HEADERS }  = require('opentracing');
const initTracer = require('./lib/tracer');

const serviceName = 'hello-world';
const tracer = initTracer(serviceName);

sayHello('Reynor');
setTimeout(() => { tracer.close(); }, 12_000);

function httpGet(url, span) {
  const method = 'GET';
  const headers = {};

  span.setTag(Tags.HTTP_URL, url);
  span.setTag(Tags.HTTP_METHOD, method);
  span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT)
  
  tracer.inject(span, FORMAT_HTTP_HEADERS, headers);

  return axios({ method, url, headers })
	.then(({ data }) => {
	   span.finish();
           return data;
	}).catch(e => {
          span.setTag(Tags.ERROR, true);
	  span.log({ event: 'error', 'error.object': e.response.data })
	  span.finish();
	  throw e;
	});
}

function printHello(input, rootSpan) {
 const url = `http://localhost:3002/publish?helloStr=${input}`;
 const fn = 'publish';

  const span = tracer.startSpan(fn, { childOf: rootSpan.context() });
  span.log({ 'event': 'print-string', 'value': input });
  return httpGet(url, span);
}

function formatString(input, rootSpan) {
  const url = `http://localhost:3001/format?helloTo=${input}`;
  const fn = 'format';

  const span = tracer.startSpan(fn, { childOf: rootSpan.context() });

  span.log({ event: 'format-string', value: 'input' });

  return httpGet(url, span);
}

function sayHello(helloTo) {
  const span = tracer.startSpan('say-hello');
  span.setTag('hello-to', helloTo);
  
  formatString(helloTo, span)
	.then(({ data }) => printHello(data, span))
	.then(({ data }) => {
	    span.setTag(Tags.HTTP_STATUS_CODE, 200)
            span.finish();
	    return data;
	}).catch( err => {
            span.setTag(Tags.ERROR, true) 
            span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode || 500);
            span.finish();
            throw err;
        });

}
