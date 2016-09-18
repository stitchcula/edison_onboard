/**
 * Created by stitchcula on 2016/9/5.
 */

import mqtt from 'mqtt'
import schedule from 'node-schedule'
import m  from 'mraa'
import request from 'co-request'
var redis=require('co-redis')(require('redis').createClient(process.env['REDIS_PORT'], process.env['REDIS_HOST']))

var device_token=null
const device_id="FZEDA447D00D1B501"
var device_uin=null
var mqtt_mode="local"
var mqtt_cli=[0,start_mqtt_local('mqtt://localhost')];
(async ()=>{
    var nodes_down_init=[]
    for(var i=0;i<8;i++)
        nodes_down_init[i]={node_id:0,msg_c:""}
    await redis.set("nodes_down_cache",JSON.stringify(nodes_down_init))
})()

const j=schedule.scheduleJob('*/2 * * * * *',async ()=>{
    if(!device_token){
        var res=await request("http://shibeta.com:8007/user/bind?device_id="+device_id)
        res=JSON.parse(res.body)
        if(!res.err_code) {
            device_token = res.result.token
            device_uin = res.result.uin
            await redis.set("device_token",device_token)
            await redis.set("device_uin",device_uin)
            mqtt_mode="remote"
            mqtt_cli[0] = start_mqtt_remote('mqtt://shibeta.com:8005')
        }
    }
    var data=await redis.get("nodes_up_cache")//length=8,{node_id,msg_c;{node_type,msg_type,msg_id,msg_c}}
    if(!data)
        return 0
    data=JSON.parse(data)
    for(var i=0;i<data.length;i++){
        if(data[i].msg_c.length>2) {//长度<3则为心跳包
            var mqtt_i = mqtt_mode == "remote" ? 0 : 0//todo:?0:1
            data[i].msg_c=JSON.parse(data[i].msg_c)
            mqtt_cli[mqtt_i].publish('$SMTH/'+device_id,JSON.stringify({
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
        username:JSON.stringify({device_id}),//edison_id
        password:device_token//token
    })
    cli.on('connect',async (c)=>{
        mqtt_mode="remote"
        await redis.set("node_loop_enable",true)
        cli.subscribe('$SMTH/'+device_uin);
        cli.publish('$SMTH/'+device_id,JSON.stringify({
            node_id:"46585654",
            node_type:"LIGHT",
            msg_type:"NOTICE",
            msg_id:"000001",
            msg_c:"hello mqtt"
        }));
    })
    cli.on('message',async (topic,message)=>{
        console.log(topic,message.toString());
        message=JSON.parse(message.toString())
        if(message.node_type=="light"){
            var pin = new m.Gpio(7)
            pin.dir(m.DIR_OUT)
            if(message.msg_c="1"){
                pin.write(1);
            }else{
                pin.write(0);
            }
        }
        var nodes_down=JSON.parse(await redis.get("nodes_down_cache"))//length=8
        for(var i=0;i<nodes_down.length;i++)
            if(nodes_down[i].node_id==message.node_id){
                nodes_down[i].msg_c=message.msg_c
            }
        await redis.set("nodes_down_cache",JSON.stringify(nodes_down))
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