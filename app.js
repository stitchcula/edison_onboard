/**
 * Created by stitchcula on 2016/9/5.
 */

import mqtt from 'mqtt'

const cli=mqtt.connect('mqtt://shibeta.com:8005')

cli.on('connect',()=>{
    cli.subscribe('presence');
    cli.publish('presence', 'Hello mqtt');
})

cli.on('message',(topic,message)=>{
    console.log(message.toString());
    cli.end();
})