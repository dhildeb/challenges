'use strict'
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import  { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import  { resourceFromAttributes } from '@opentelemetry/resources';
import  { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const traceExporter = new ConsoleSpanExporter();
const sdk = new NodeSDK({
    resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'challenges',
    }),
    traceExporter,
    // instrumentations: [getNodeAutoInstrumentations()]
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start();

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});