/**
 * Created by stitchcula on 2016/9/5.
 */

import schedule from 'node-schedule'
import m  from 'mraa'
var redis=require('co-redis')(require('redis').createClient(process.env['REDIS_PORT'], process.env['REDIS_HOST']))

var g_mux=true;
var g_nodes_down=[]
    ,g_nodes_up=[];

const main=async()=>{
    console.log('MRAA Version: ' + m.getVersion());

    const u = new m.Uart(0)
    u.setBaudRate(115200);
    u.setMode(8, 0, 1);
    u.setFlowcontrol(false, false);
    u.setTimeout(40,20,0);

    const j=schedule.scheduleJob('*/2 * * * * *',()=>{
        node_loop(u)
    })
}
main()

/********/

async function node_loop(u) {
    if(!(await redis.get("node_loop_enable")))
        if(g_mux){
            g_mux=false
            return await smart_config(u)
        }else
            return
    console.log("j:"+new Date().getTime())
    g_nodes_down=JSON.parse(await redis.get("nodes_down_cache"))
    g_nodes_up=[]
    for(var i=0;i<g_nodes_down.length;i++){
        u.writeStr(JSON.stringify({
            node_id:g_nodes_down[i].node_id,
            msg_c:g_nodes_down[i].msg_c
        }))
        delay(20)
        g_nodes_down[i].msg_c=""
        g_nodes_up[i].node_id=g_nodes_down[i].node_id
        g_nodes_up[i].msg_c=u.readStr(32)
        await delay(60)
    }
    await redis.set("nodes_down_cache",JSON.stringify(g_nodes_down))
    await redis.set("nodes_up_cache",JSON.stringify(g_nodes_up))
}

async function smart_config(u){
    var power = new m.Gpio(3)
    power.dir(m.DIR_OUT)
    var pin = new m.Gpio(4)
    pin.dir(m.DIR_OUT)

    power.write(0);//初始化拉低
    await delay(200);
    pin.write(0)//初始化拉低
    await delay(200);
    power.write(1)//启动nodemcu
    await delay(1000);
    console.log("8266 pwoer on at "+new Date())
    /*
     for(var i=0;i<128;i++){
     u.readStr(4)
     }*/
    if(cutEnd(u)){
        pin.write(1)//上升沿触发
        console.log(u.readStr(6));
        await delay(200);
        u.writeStr("sniff\r");
        await delay(500);
        while(true) {
            var res = u.readStr(32)
            //todo
            var arr=res.split("|")
            LinkWifi(arr[0],arr[1])
            console.log(res)
            if(res!=null)
                break
            else
                delay(500)
        }
        await delay(200);
        pin.write(0)
        power.write(0);
    }else{
        pin.write(0)
        power.write(0);
    }
}

function delay(t){
    return new Promise(r=>setTimeout(r,t))
}

function cutEnd(u){
    function cutEndFinder(a,b,c,d,i){
        //console.log("d:"+d+",i:"+i)
        if(a=="S"&&b=="M"&&c=="T"&&d=="H")
            return true
        else if(i>1200)
            return false
        else
            return cutEndFinder(b,c,d,u.readStr(1),i+1)
    }
    return cutEndFinder("0","0","0",u.readStr(1),0)
}

function LinkWifi(ssid, pwd) {
    console.log("ssid:"+ssid)
    console.log("pwd:"+pwd)
}