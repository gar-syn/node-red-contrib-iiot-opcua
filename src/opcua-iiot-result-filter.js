/*
 The BSD 3-Clause License

 Copyright 2017,2018 - Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.
 node-red-contrib-iiot-opcua
 */
'use strict'

/**
 * OPC UA node representation for Node-RED OPC UA IIoT nodes.
 *
 * @param RED
 */
module.exports = function (RED) {
  // SOURCE-MAP-REQUIRED
  let coreFilter = require('./core/opcua-iiot-core-filter')
  let _ = require('underscore')

  function OPCUAIIoTResultFilter (config) {
    RED.nodes.createNode(this, config)
    this.nodeId = config.nodeId
    this.datatype = config.datatype
    this.fixedValue = config.fixedValue
    this.fixPoint = parseInt(config.fixPoint) | 2
    this.withPrecision = config.withPrecision
    this.precision = parseInt(config.precision) | 2
    this.entry = config.entry
    this.justValue = config.justValue
    this.withValueCheck = config.withValueCheck
    this.minvalue = config.minvalue
    this.maxvalue = config.maxvalue
    this.defaultvalue = config.defaultvalue
    this.topic = config.topic
    this.name = config.name
    this.showErrors = config.showErrors

    let node = this
    node.subscribed = false

    if (node.withValueCheck) {
      node.minvalue = node.convertDataType(node.minvalue)
      node.maxvalue = node.convertDataType(node.maxvalue)
    }

    node.status({fill: 'blue', shape: 'ring', text: 'new'})

    node.nodeIdToFilter = function (msg) {
      let doFilter = true
      let nodeList = coreFilter.core.buildNodesToRead(msg)
      let elementNodeId = null

      if (nodeList && nodeList.length) {
        doFilter = !nodeList.some(function (element, index, array) {
          elementNodeId = element.nodeId || element
          return elementNodeId.toString() === node.nodeId.toString()
        })
      }

      return doFilter
    }

    node.on('input', function (msg) {
      if (!msg.hasOwnProperty('payload') || msg.payload === null || msg.payload === undefined) {
        coreFilter.internalDebugLog('filtering message without payload ' + JSON.stringify(msg))
        return
      }

      if (node.nodeIdToFilter(msg)) {
        return
      } else if (msg.addressSpaceItems) {
        let filteredNodeIds = _.filter(msg.addressSpaceItems, function (entry) {
          return entry.nodeId === node.nodeId
        })

        if (filteredNodeIds.length < 1) {
          return
        }
      } else {
        // just if not multiple request!
        if (msg.topic !== node.nodeId) { // TODO: that is very old and should be deleted
          return
        }
      }

      msg.filtertype = 'filter'
      let result = msg.payload

      node.status({fill: 'green', shape: 'dot', text: 'active'})

      switch (msg.nodetype) {
        case 'read':
          result = node.filterByReadType(msg)
          break
        case 'write':
          result = node.filterByWriteType(msg)
          break
        case 'listen':
          result = node.filterByListenType(msg)
          break
        default:
          if (node.showErrors) {
            node.error(new Error('unknown node type injected to filter for ' + msg.nodetype), msg)
          }
          coreFilter.internalDebugLog('unknown node type injected to filter for ' + msg.nodetype)
      }

      if (result === undefined || result === null) {
        coreFilter.internalDebugLog('result null or undefined' + JSON.stringify(msg))
        return
      }

      if (result.hasOwnProperty('value')) {
        result = result.value
      }

      let resultDataType = typeof result
      if (result.hasOwnProperty('datatype')) {
        resultDataType = result.datatype || typeof result
      }

      if (resultDataType && resultDataType.toString() !== node.datatype.toString()) {
        result = node.convertDataType(result)
      }

      if (result === undefined || result === null) {
        coreFilter.internalDebugLog('converted result null or undefined' + JSON.stringify(msg))
        if (node.showErrors) {
          node.error(new Error('converted result null or undefined'), msg)
        }
      } else {
        try {
          if (node.fixPoint >= 0 && node.fixedValue) {
            result = Number.parseFloat(result).toFixed(node.fixPoint)
            result = parseFloat(result)
          }

          if (node.precision >= 0 && node.withPrecision) {
            result = Number.parseFloat(result).toPrecision(node.precision)
            result = parseFloat(result)
          }

          if (node.withValueCheck) {
            if (result < node.minvalue || result > node.maxvalue) {
              result = node.defaultvalue
            }
          }
        } catch (err) {
          if (node.showErrors) {
            node.error(err, msg)
          }
        }
      }

      if (node.justValue) {
        node.send({payload: result, topic: node.topic || msg.topic, nodeId: node.nodeId})
      } else {
        node.send({payload: result, topic: node.topic || msg.topic, nodeId: node.nodeId, input: msg})
      } // here node topic first to overwrite for dashboard
    })

    node.filterByReadType = function (msg) {
      let result = null

      let minArraySize = node.entry
      coreFilter.internalDebugLog('filter by read type ' + msg.readtype)

      switch (msg.readtype) {
        case 'Meta':
          result = msg.payload // TODO: build an array structure for output
          break
        case 'read':
          if (msg.multipleRequest && msg.payload.length >= minArraySize) {
            result = node.extractValueFromOPCUAArrayStructure(msg, node.entry - 1)
          } else {
            result = node.extractValueFromOPCUAStructure(msg)
          }
          break
        case 'VariableValue':
          if (msg.multipleRequest && msg.payload.length >= minArraySize) {
            result = node.extractValueFromOPCUAArrayStructure(msg, node.entry - 1)
          } else {
            result = node.extractValueFromOPCUAStructure(msg)
          }
          break
        case 'AllAttributes':
          result = msg.payload // TODO: build an array structure for output
          break
        default:
          result = node.extractValueFromOPCUAStructure(msg)
          break
      }

      if (result.hasOwnProperty('value')) {
        result = result.value
      }

      coreFilter.internalDebugLog('filter by read type result ' + JSON.stringify(result))

      return result
    }

    node.extractValueFromOPCUAArrayStructure = function (msg, entryIndex) {
      let result = null
      let payload = msg.payload[entryIndex]

      if (!payload) {
        return result
      }

      if (payload.hasOwnProperty('value')) {
        if (payload.value.hasOwnProperty('value')) {
          result = payload.value.value
        } else {
          result = payload.value
        }
      } else {
        result = payload
      }

      return result
    }

    node.extractValueFromOPCUAStructure = function (msg) {
      let result = null

      if (msg.payload.hasOwnProperty('value')) {
        if (msg.payload.value.hasOwnProperty('value')) {
          result = msg.payload.value.value
        } else {
          result = msg.payload.value
        }
      } else {
        result = msg.payload
      }

      return result
    }

    node.filterByWriteType = function (msg) {
      let result = null

      if (msg.payload.hasOwnProperty('value')) {
        result = msg.payload.value
      } else {
        result = msg.payload
      }

      if (result && result.hasOwnProperty('value')) {
        result = result.value
      }

      return result
    }

    node.filterByListenType = function (msg) {
      let result = null

      if (msg.payload && msg.payload.hasOwnProperty('value')) {
        result = msg.payload.value
      } else {
        result = msg.payload
      }

      if (result && result.hasOwnProperty('value')) {
        result = result.value
      }

      return result
    }

    node.convertDataType = function (result) {
      coreFilter.internalDebugLog('data type convert for ' + node.nodeId)
      return coreFilter.core.convertDataValueByDataType({value: result}, node.datatype)
    }
  }

  RED.nodes.registerType('OPCUA-IIoT-Result-Filter', OPCUAIIoTResultFilter)

  RED.httpAdmin.get('/opcuaIIoT/object/DataTypeIds', RED.auth.needsPermission('opcuaIIoT.node.read'), function (req, res) {
    let typeList = require('node-opcua').DataTypeIds
    let invertedTypeList = _.toArray(_.invert(typeList))
    let resultTypeList = []

    let typelistEntry
    for (typelistEntry of invertedTypeList) {
      resultTypeList.push({ nodeId: 'i=' + typeList[typelistEntry], label: typelistEntry })
    }

    res.json(resultTypeList)
  })
}
