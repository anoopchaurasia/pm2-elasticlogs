'use strict';

const pm2 = require('pm2');
const pmx = require('pmx');
const packageJSON = require('./package');
const conf = pmx.initModule();
const elasticLibModule = require('./libs/elasticsearch');
const elasticLib = new elasticLibModule(conf.elasticsearch_host, conf.elasticsearch_index);
/**
 * Change default host to elasticsearch : pm2 set pm2-elasticlogs:elasticsearch_host 'http://localhost:9200'
 *
 *   Start module in development mode
 *          $ pm2 install .
 */

pm2.Client.launchBus(function (err, bus) {
    if (err)
        return console.error(err);

    bus.on("log:out", function (packet) {
        if (packet.process.name === packageJSON.name) {
            return;
        }

        elasticLib.add({
            message: packet.data,
            log_level: "INFO",
            application: packet.process.name,
            process_id: packet.process.pm_id,
            type: "logger"
        }).catch((e) => {
            console.error(e)
        });
    });

    bus.on("log:err", function (packet) {
        if (packet.process.name === packageJSON.name) {
            return;
        }

        elasticLib.add({
            message: packet.data,
            log_level: "ERROR",
            application: packet.process.name,
            process_id: packet.process.pm_id,
            type: "logger"
        }).catch((e) => {
            console.error(e)
        });

    });

    bus.on('close', function () {
        console.log('PM2 Logstash Connector: Bus closed');
        pm2.disconnectBus();
    });
});
