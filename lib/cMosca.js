/**
 * Created by stitchcula on 2016/9/18.
 */


import mosca from 'mosca'
import request from 'co-request'
const device_id="FZEDA447D00D1B501"

export default class Mosca {
    constructor(redis) {
        this.redis = redis
        var ascoltatore = {
            type: 'redis',
            redis: require('redis'),
            host: process.env['REDIS_HOST'],
            port: process.env['REDIS_PORT'],
            return_buffers: true
        }
        this.settings = {
            port: 1883,
            backend: ascoltatore,
            persistence: {
                factory: mosca.persistence.Redis,
                host: process.env['REDIS_HOST'],
                port: process.env['REDIS_PORT']
            }
        }
    }
    listen(port){
        if(port) this.settings.port=port
        this.server = new mosca.Server(this.settings)
        this.server.on('ready',this.onReady.bind(this))
        this.server.on('published',this.onPublished.bind(this))
        this.server.on("clientDisconnected",this.onDisconnected.bind(this))
    }
    async onReady(){
        this.server.authenticate =async function(client, node_id, node_type, callback) {//online login
            /*
            node_type=node_type.toString()
            var node_loop_enable=await redis.get("node_loop_enable")
            if(node_loop_enable||node_loop_enable=="true"){

            }*/
            callback(null,true)
        }.bind(this)
        console.log("MQTT broker is running at "+new Date())
    }
    async onPublished(packet){
        
    }
    
    async onDisconnected(client){//offline logout
        var res=await this.mongo.collection("online_list")
            .removeOne({session:client.id})
        /*
         this.server.publish({topic:"$SMTH/"+res.device_id+"/OFFLINE",
         payload:packet.payload,
         qos:1,retain:false})
         */
        console.log(res.result)
    }
}
