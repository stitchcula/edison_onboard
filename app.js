/**
 * Created by stitchcula on 2016/9/5.
 */

import mqtt from 'mqtt'
import schedule from 'node-schedule'
var redis=require('co-redis')(require('redis').createClient(process.env['REDIS_PORT'], process.env['REDIS_HOST']))

var mqtt_mode="remote"
var mqtt_cli=[start_mqtt_remote('mqtt://shibeta.com:8005'),
                start_mqtt_local('mqtt://localhost')];
(async ()=>{
    var nodes_down_init=[]
    for(var i=0;i<8;i++)
        nodes_down_init[i]={node_id:0,msg_c:""}
    await redis.set("nodes_down_cache",nodes_down_init)
})()

const j=schedule.scheduleJob('*/2 * * * * *',async ()=>{
    var data=await redis.get("nodes_up_cache")
    if(!data)
        return 0
    data=JSON.parse(data)
    for(var i=0;i<data.length;i++){
        if(data[i].msg_c.length>2) {
            var mqtt_i = mqtt_mode == "remote" ? 0 : 0//todo:?0:1
            data[i].msg_c=JSON.parse(data[i].msg_c)
            mqtt_cli[mqtt_i].publish('$SMTH/test',JSON.stringify({
                node_id:data[i].node_id,
                node_type:data[i].msg_c.node_type,
                msg_type:data[i].msg_c.msg_type,
                msg_id:data[i].msg_c.msg_id,
                msg_c:data[i].msg_c.msg_c
            }));
        }
    }
})

function start_mqtt_remote(url) {
    var cli=mqtt.connect(url,{
        username:"test",//edison_id
        password:"test"//token
    })
    cli.on('connect',async (c)=>{
        mqtt_mode="remote"
        await redis.set("node_loop_enable",true)
        cli.subscribe('$SMTH/test');
        cli.subscribe('$SMTH/test/NOTICE');
        cli.publish('$SMTH/test',JSON.stringify({
            node_id:"46585654",
            node_type:"LIGHT",
            msg_type:"NOTICE",
            msg_id:"000001",
            msg_c:"hello mqtt"
        }));
    })
    cli.on('message',(topic,message)=>{
        console.log(topic);
    })
    cli.on('offline',async ()=> {
        if(await redis.get("node_loop_enable"))
            await redis.set("node_loop_enable",false)
        mqtt_mode="local"
    })
    return cli
}

function start_mqtt_local(url){
    /*
    var cli=mqtt.connect(url)
    cli.on('connect',(c)=>{
        cli.subscribe('$SMTH/test');
        cli.subscribe('$SMTH/test/NOTICE');
        cli.publish('$SMTH/test',JSON.stringify({
            node_id:"46585654",
            node_type:"LIGHT",
            msg_type:"NOTICE",
            msg_id:"000001",
            msg_c:"hello mqtt"
        }));
    })
    cli.on('message',(topic,message)=>{
        console.log(topic);
    })
    return cli
    */
}