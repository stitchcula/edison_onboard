/**
 * Created by stitchcula on 2016/9/5.
 */

'use strict';

var be=new Date().getTime()

require('babel-core/register')({
    presets: ['es2015-node6','stage-3']
});

require('./uart_loop.js')

var en=new Date().getTime()
console.log("\nBabel converting used "+(en-be)/1000+"s.\n")