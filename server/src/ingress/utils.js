const uuidByString = require('uuid-by-string')

const extractErrors = (node, acc = []) => {
  if (node.error.length > 0) {
    acc.push(...node.error)
  }

  if (node.child) {
    node.child.map(n => {
      extractErrors(n, acc)
    })
  }

  return acc
}

function parseTS(message) {
  return new Date(message.seconds * 1000 + message.nanos / 1000000)
}

function prepareTraces(report) {
  return Object.entries(report.tracesPerQuery).reduce((acc, [key, v]) => {
    return [
      ...acc,
      ...v.trace.map(trace => {
        return {
          schemaTag: report.header.schemaTag,
          key,
          operationId: uuidByString(key),
          ...trace,
          startTime: parseTS(trace.startTime),
          endTime: parseTS(trace.endTime),
          hasErrors: extractErrors(trace.root).length > 0
        }
      })
    ]
  }, [])
}

module.exports = {
  extractErrors,
  prepareTraces
}
