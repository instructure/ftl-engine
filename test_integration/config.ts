let path = require('path')
module.exports = function() {
  return {
    defaultVersion: '1.0.0',
    activities: [
      path.join(__dirname, 'activities')
    ],
    notifier: {
      region: process.env.AWS_REGION || 'us-east-1',
      snsTopicName: 'ftl-enginge-alerts',
      awsAccountId: '123456789'
    },
    logger: {
      name: 'ftl-engine',
      devMode: true
    },
    swf: {
      domainName: process.env.SWF_DOMAIN || 'ftl-engine-test',
      workflowName: 'ftl-engine'
    },
    metrics: {
      host: 'localhost',
      port: 5678
    },
    claimCheck: {
      bucket: 'ftl-check-store',
      prefix: ''
    }
  }
}
