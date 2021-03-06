![Platform Node-RED](http://b.repl.ca/v1/Platform-Node--RED-red.png)
![Node-RED IIoT OPC UA](http://b.repl.ca/v1/Node--RED-IIoT_OPC_UA-blue.png)
![ES_Source_Version](http://b.repl.ca/v1/JS_Source-ES6-yellow.png)
![ES_Deploy_Version](http://b.repl.ca/v1/JS_Deploy-ES2015-yellow.png)
![NodeJS_Version](http://b.repl.ca/v1/NodeJS-9.x-green.png)
[![NPM download](https://img.shields.io/npm/dm/node-red-contrib-iiot-opcua.svg)](http://www.npm-stats.com/~packages/node-red-contrib-iiot-opcua)
[![NPM version](https://badge.fury.io/js/node-red-contrib-iiot-opcua.png)](https://www.npmjs.com/package/node-red-contrib-iiot-opcua)
[![Build Status](https://travis-ci.org/biancode/node-red-contrib-iiot-opcua.svg?branch=master)](https://travis-ci.org/biancode/node-red-contrib-iiot-opcua)

# node-red-contrib-iiot-opcua 

## The IoT/IIoT OPC UA toolbox package for Node-RED based on node-opcua.

[![opcuaiiot64](images/opcua-iiot-logo64-glass.png)](https://www.npmjs.com/package/node-red-contrib-iiot-opcua/)
[![ISA95](images/logoISA95blue2.png)](https://opcfoundation.org/developer-tools/specifications-unified-architecture/isa-95-common-object-model/)
[![ISA95](images/logoRAMI40blue.png)](http://www.plattform-i40.de/)

If you like that contributor's package for OPC UA, then please give us your star at [GitHub][3] !

**[Become a backer of the project straight away!][2]**

* tested with Node 8 LTS
* tested with Node 9
* based on node-opcua v0.2.x

## Install

Run command on Node-RED installation directory.

	npm install node-red-contrib-iiot-opcua 

or run command for global installation.

	npm install -g node-red-contrib-iiot-opcua 

try these options on npm install to build, if you have problems to install

    --unsafe-perm --build-from-source
    
![Flow Example](images/opcua-iiot-v109s2.png)
  
## Contributing

**[Become a backer of the project straight away!][2]**

Let's work together! 
Please read and in best case accept [CONTRIBUTING](CONTRIBUTING.md) by your sign and send it via E-Mail.
You could also send just a pull request or issues while testing, please!

### Debug

Debugging on remote devices is important to help users. The verbose logging
provides interesting points in different abstractions if IDE or console debugging is not possible.

Start debug with Node-RED in verbose (-v) mode to get a verbose logging:

    DEBUG=opcuaIIoT* node-red -v 1>nodeREDIIoTOPCUA.log 2>&1

or on local Node-RED
    
    DEBUG=opcuaIIoT* node red.js -v 1>nodeREDIIoTOPCUAServer.log 2>&1

#### Debug Options

Please, read the [Wiki article][7]
    
### Wiki

Follow the [white rabbit][4]!

### Your own address space model!

With the flex server you could create your own information model with the OPC UA address space.

![Flex server Example](images/opcua-iiot-flex-server-example.png)

The server node contains demo objects and variables 
to start playing with OPC UA method call, read and write operations.

![Flow Example](images/opcua-iiot-v109.png)

**... secure reading from OPC UA servers with your own key pairs ...**

![Read Example](images/opcua-iiot-read-example.png)

**... create your own variables and objects from events ...**

![ASO Example](images/opcua-iiot-aso-example.png)

## Package Information

### Known Issues and TODO's

Ideas
* converting in Result Filter is not finished yet
* dynamic methods
* dynamic IP for connector
* individual import of XML to get more types and objects

Errors
* more Bad status situations handling
* Publish Engine Error
* API changes to 0.2.+ bring some errors - Please, test and report issues at GitHub!


### License

The BSD 3-Clause License

[Klaus Landsdorf][1]

That is a whole new Node-RED package started in 2017 based on the node-opcua v0.1.x and the API documentation.
The old copyrights by Mika Karaila are just to honor his pioneer work in the years 2015/2016 for Node-RED and OPC UA.

### Important

This is **not** an official product of the OPC Foundation or Plattform Industrie 4.0.
It is just to provide OPC UA to Node-RED based on node-opcua.

### Contribution node-opcua

I'd like to give special thanks to [Etienne Rossignon][6] 
for the node-opcua packages and very special for the node-opcua-isa95 package! 

[1]:https://bianco-royal.cloud/
[2]:https://bianco-royal.cloud/supporter/
[3]:https://github.com/biancode/node-red-contrib-iiot-opcua
[4]:https://github.com/biancode/node-red-contrib-iiot-opcua/wiki
[6]:https://github.com/erossignon
[7]:https://github.com/biancode/node-red-iiot-opcua-publicbeta/wiki/DEBUG
