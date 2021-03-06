/*
 The BSD 3-Clause License

 Copyright 2017,2018 - Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.
 node-red-contrib-iiot-opcua
 */
'use strict'

/**
 * OPC UA node representation for Node-RED OPC UA IIoT method call.
 *
 * @param RED
 */
module.exports = function (RED) {
  // SOURCE-MAP-REQUIRED
  let coreMethod = require('./core/opcua-iiot-core-method')

  function OPCUAIIoTMethodCaller (config) {
    RED.nodes.createNode(this, config)
    this.objectId = config.objectId
    this.methodId = config.methodId
    this.methodType = config.methodType
    this.value = config.value
    this.justValue = config.justValue
    this.name = config.name
    this.showStatusActivities = config.showStatusActivities
    this.showErrors = config.showErrors
    this.inputArguments = config.inputArguments
    this.connector = RED.nodes.getNode(config.connector)

    let node = this
    node.reconnectTimeout = 1000
    node.sessionTimeout = null

    node.verboseLog = function (logMessage) {
      if (RED.settings.verbose) {
        coreMethod.internalDebugLog(logMessage)
      }
    }

    node.statusLog = function (logMessage) {
      if (RED.settings.verbose && node.showStatusActivities) {
        node.verboseLog('Status: ' + logMessage)
      }
    }

    node.setNodeStatusTo = function (statusValue) {
      node.statusLog(statusValue)
      let statusParameter = coreMethod.core.getNodeStatus(statusValue, node.showStatusActivities)
      node.status({fill: statusParameter.fill, shape: statusParameter.shape, text: statusParameter.status})
    }

    node.handleMethodError = function (err, msg) {
      node.verboseLog('Method Handle Error '.red + err)

      if (node.showErrors) {
        node.error(err, msg)
      }

      coreMethod.internalDebugLog(err.message)
      node.setNodeStatusTo('error')

      if (err.message && err.message.includes('BadSession')) {
        node.connector.resetBadSession()
      }
    }

    node.handleMethodWarn = function (message) {
      if (node.showErrors) {
        node.warn(message)
      }

      coreMethod.internalDebugLog(message)
    }

    node.on('input', function (msg) {
      coreMethod.detailDebugLog(JSON.stringify(msg))
      let message = {}

      message.objectId = msg.payload.objectId || node.objectId
      message.methodId = msg.payload.methodId || node.methodId
      message.methodType = msg.payload.methodType || node.methodType
      message.inputArguments = msg.payload.inputArguments || node.inputArguments
      message.nodetype = 'method'

      if (!message.objectId) {
        node.handleMethodWarn('No Object-Id Found For Method Call')
        return
      }

      if (!message.methodId) {
        node.handleMethodWarn('No Method-Id Found For Method Call')
        return
      }

      if (!message.inputArguments) {
        node.handleMethodWarn('No Input Arguments Found For Method Call')
        return
      }

      if (!message.methodType) {
        node.handleMethodWarn('No Method Type Found For Method Call')
        return
      }

      if (node.opcuaSession) {
        node.callMethodOnSession(message)
      } else {
        node.handleMethodWarn('Session Not Ready For Method Call')
      }
    })

    node.callMethodOnSession = function (msg) {
      if (msg.methodId && msg.inputArguments) {
        coreMethod.getArgumentDefinition(node.opcuaSession, msg).then(function (results) {
          coreMethod.detailDebugLog('Call Argument Definition Results: ' + JSON.stringify(results))
          node.callMethod(msg, results)
        }).catch(node.handleMethodError)
      } else {
        coreMethod.internalDebugLog(new Error('No Method Id And/Or Parameters'))
      }
    }

    node.callMethod = function (msg, definitionResults) {
      coreMethod.callMethods(node.opcuaSession, msg).then(function (data) {
        coreMethod.detailDebugLog('Methods Call Results: ' + JSON.stringify(data))

        let result = null
        let outputArguments = []
        let message = {
          nodetype: 'method',
          injectType: 'call',
          methodType: data.msg.methodType
        }

        for (result of data.results) {
          outputArguments.push({statusCode: result.statusCode, outputArguments: result.outputArguments})
        }

        let dataValuesString = {}
        if (node.justValue) {
          dataValuesString = JSON.stringify(outputArguments, null, 2)
        } else {
          dataValuesString = JSON.stringify({
            results: data.results,
            definition: definitionResults
          }, null, 2)
        }

        try {
          RED.util.setMessageProperty(message, 'payload', JSON.parse(dataValuesString))
        } catch (err) {
          if (node.showErrors) {
            node.warn('JSON not to parse from string for dataValues type ' + typeof readResult)
            node.error(err, msg)
          }
          message.payload = dataValuesString
          message.error = err.message
        }

        node.send(message)
      })
    }

    node.setOPCUAConnected = function (opcuaClient) {
      node.opcuaClient = opcuaClient
      node.setNodeStatusTo('connected')
    }

    node.opcuaSessionStarted = function (opcuaSession) {
      node.opcuaSession = opcuaSession
      node.setNodeStatusTo('active')
    }

    node.connectorShutdown = function (opcuaClient) {
      coreMethod.internalDebugLog('Connector Shutdown')
      if (opcuaClient) {
        node.opcuaClient = opcuaClient
      }
    }

    if (node.connector) {
      node.connector.on('connected', node.setOPCUAConnected)
      node.connector.on('session_started', node.opcuaSessionStarted)
      node.connector.on('after_reconnection', node.connectorShutdown)
    } else {
      throw new TypeError('Connector Not Valid')
    }

    node.setNodeStatusTo('waiting')
  }

  RED.nodes.registerType('OPCUA-IIoT-Method-Caller', OPCUAIIoTMethodCaller)

  RED.httpAdmin.get('/opcuaIIoT/method/basicDataTypesForSelect', RED.auth.needsPermission('opcuaIIoT.method.read'), function (req, res) {
    res.json(coreMethod.core.getBasicDataTypesForSelect())
  })
}
