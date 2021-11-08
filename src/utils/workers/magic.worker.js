
import {CallbackManager} from './workerCallbacks'

let manager = new CallbackManager();
let id = `worker_${Math.floor(Math.random()*10000000000)}`;
let canvas = manager.canvas; 
let ctx = manager.canvas.context;
let context = ctx; //another common reference
let counter = 0;

self.onmessage = async (event) => {
  // define gpu instance
  // console.log("worker executing...", event)
  // console.time("worker");
  let input;
  if(event.data.output) input = event.data.output; //from events
  else input = event.data;
  //console.log(input)

  let dict;
  let output = undefined;
  let emitted = false;
  if(typeof input === 'object'){
    if(input.canvas !== undefined) { //if a new canvas is sent (event.data.canvas = htmlCanvasElement.transferControlToOffscreen()).
      manager.canvas = input.canvas; 
      canvas = manager.canvas;
    }
    if(input.context !== undefined ) { //set the context
      manager.ctx = manager.canvas.getContext(input.context);
      manager.context = manager.ctx;
      ctx = manager.ctx;
      context = manager.ctx;
    } 
    let eventSetting = manager.checkEvents(input.foo,input.origin);
    //console.log(event)

    output = await manager.checkCallbacks(event);  // output some results!
    counter++; //just tracks the number of calls made to the worker

    //we are gonna assume typedarrays are to be transferred for speed so throw those all into the transfer array
    let transfer = undefined;
    if(output) {
      if(output.__proto__?.__proto__?.constructor.name === 'TypedArray') { 
        transfer = [output.buffer];
      } else if (typeof output === 'Object') {
          for(const key in output) {
              if(output[key].__proto__?.__proto__?.constructor.name === 'TypedArray') {
                  if(!transfer) transfer = output[key].buffer;
                  else transfer.push(output[key].buffer);
              }
          }
      }
    }
    //if(input.foo === 'particleStep') console.log(output, transfer);

    dict = {output: output, foo: input.foo, origin: input.origin, counter:counter};
    
    if(eventSetting) {manager.EVENTS.emit(eventSetting.eventName,dict,transfer); emitted = true;} //if the origin and foo match an event setting on the thread, this emits output as an event
    else if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        self.postMessage(dict,undefined,transfer);
    } 
  }
  /*
    now run "addfunc" to render something in the linked canvas from the worker thread
    e.g. workers.postToWorker('addfunc',['offscreenrender',`(args)=>{
      ctx.clearRect(0,0,canvas.width,canvas.height); //or this.offscreenctx
      ctx.fillRect(25, 25, 100, 100);
      ctx.clearRect(45, 45, 60, 60);
      ctx.strokeRect(50, 50, 50, 50);
    }`]);
  */
  //if(event.data.eventName) console.log("event sent to thread", event.data)
  if(!emitted) manager.EVENTS.workerCallback(event.data); //checks for eventName tag and setState locally

  // console.timeEnd("worker");
  return dict;
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    //addEventListener('message', self.onmessage);
} 

manager.EVENTS.emit('newWorker',id);

export default self