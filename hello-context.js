const axios = require('axios');
const cls = require('continuation-local-storage');
const clsBluebird = require('cls-bluebird');
const opentracing = require('opentracing');
const initTracer = require('./lib/tracer');

const { Tags, FORMAT_HTTP_HEADERS } = opentracing;

const tracer = initTracer('hello-world');
const ns = cls.createNamespace('myNamespace');
clsBluebird(ns);

sayHello('Dark', 'Hello');

function httpGet(url, span) {
  const method = 'GET';
  const headers = {};

  span.setTag(Tags.HTTP_URL, url);
  span.setTag(Tags.HTTP_METHOD, method);
  span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
  
  tracer.inject(span, FORMAT_HTTP_HEADERS, headers);

  return axios({ headers, url, method })
	.then(({ data }) => {
	  span.finish();
	  return data;
	}).catch(e => {
	   span.log({ event: 'error', 'error.object': e.response.data });
           span.finish();
	   throw e;
	});
}

function formatString(input) {
  const parentSpan = ns.get('current_span');

  const fn = 'format';
  const url = `http://formatter:3001/format?helloTo=${input}`;

  const span = tracer.startSpan(fn, { childOf: parentSpan.context() });
  span.log({
    event: 'format-string',
    value: input
  });

  return httpGet(url, span);
}

function printHello(input) {
  const parentSpan = ns.get('current_span');

  const fn = 'publish';
  const url = `http://publisher:3002/publish?helloTo=${input}`

  const span = tracer.startSpan(fn, { childOf: parentSpan.context() });
  span.log({ event: 'print-hello', value: input });

  return httpGet(url, span);
}

function sayHello(helloTo, greeting) {
  const span = tracer.startSpan('say-hello');

  span.setTag('hello-to', helloTo);
  span.setBaggageItem('greeting', greeting);

  ns.run(() => {
     ns.set('current_span', span);


    formatString(helloTo).then((data) => printHello(helloTo)).then(data => {
	span.setTag(Tags.HTTP_STATUS_CODE, 200);
	span.finish();
    }).catch(err => {
	span.setTag(Tags.ERROR, true);
	span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode || 500);

	span.finish();
	throw err;
    });
  })
}
