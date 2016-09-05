/**
 * Created by stitchcula on 2016/9/5.
 */

import mqtt from 'mqtt'

const cli=mqtt.connect('mqtt://shibeta.com:8005',{
    username:"test",//edison_id
    password:"test"//token
})

cli.on('connect',()=>{
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