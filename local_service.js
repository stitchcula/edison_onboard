/**
 * Created by stitchcula on 2016/9/18.
 */

"use strict";

import Mosca from './lib/cMosca.js'
var redis=require('co-redis')(require('redis').createClient(process.env['REDIS_PORT'], process.env['REDIS_HOST']))

(async function () {
    const mosca=new Mosca(redis)
    mosca.listen(8005)
})()