
//multithreaded event manager, spawn one per thread and import a single instance elsewhere.

/**
 * This is both a simple wrapper for a trigger-only state manager as well 
 * as an interface for multithreaded events for simpler, more dynamic threading pipelines
 * 
 * From any thread:
 * emit -> tx
 * rx -> run trigger 
 * 
 */

import {StateManager} from '../StateManager'

export class Events {

    static STATEMANAGERCLASS = StateManager;

    constructor(workermanager=undefined) {

        //redundancy is for blob workers
        this.STATEMANAGERCLASS = StateManager;

        this.state = new this.STATEMANAGERCLASS({},undefined,false); //trigger only state (no overhead)
        this.workermanager = workermanager;

        if(workermanager !== undefined) { //only in window
            let found = workermanager.workerResponses.find((foo) => {
                if(foo.name === 'eventmanager') return true;
            });
            if(!found) {
                workermanager.addCallback('eventmanager',this.workerCallback);
            }
        } 

    }

    //subscribe a to an event, default is the port reponse 
    subEvent(eventName, response=(output)=>{console.log(eventName,output);}) {
        return this.state.subscribeTrigger(eventName,response);
    }

    unsubEvent(eventName, sub) {
        return this.state.unsubscribeTrigger(eventName,sub);
    }

    //add an event name, can optionally add them to any threads too from the main thread
    addEvent(eventName,origin=undefined,foo=undefined,workerId=undefined) {
        this.state.setState({[eventName]:undefined});
        if(this.workermanager !== undefined) {
            if(origin !== undefined || foo !== undefined) {
                if(workerId !== undefined) {
                    this.workermanager.postToWorker({origin:origin,foo:'addevent',input:[eventName,foo]},workerId);
                } else {
                    this.workermanager.workers.forEach((w)=>{
                        this.workermanager.postToWorker({origin:origin,foo:'addevent',input:[eventName,foo]},w.id); //add it to all of them since we're assuming we're rotating threads
                    });
                }
            }
        }
    }

    //remove an event
    removeEmitter(eventName) {
        this.state.unsubscribeAllTriggers(eventName);
    }

    //use this to set values by event name, will post messages on threads too
    emit(eventName, input, workerId=undefined,transfer=undefined,port=undefined) {
        let output = {eventName:eventName, output:input};
        
        if(!input || !eventName) return;
        if (this.workermanager !== undefined) { //when emitting values for workers, input should be an object like {input:0, foo'abc', origin:'here'} for correct worker callback usage
            if(workerId !== undefined) this.workermanager.postToWorker(output,workerId,transfer);
            else {this.workermanager.workers.forEach((w)=>{this.workermanager.postToWorker(output,w.id,transfer);});}
        } else if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        // run this in global scope of window or worker. since window.self = window, we're ok
            //if(port) console.log(port,output);
            if(port) port.postMessage(output,undefined,transfer);
            else postMessage(output,undefined,transfer); //thread event 
        }
        this.state.setState({[eventName]:input}); //local event 
    }

    workerCallback = (msg) => {
        if(typeof msg === 'object') {
            if(msg.eventName !== undefined && msg.output !== undefined) {
                this.state.setState({[msg.eventName]:msg.output});
            }
        }
    }

    export = () => {
        return this;
    }
}