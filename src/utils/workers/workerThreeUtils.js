import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

//this file imports a bunch of stuff so you can pass threejs functions

export class threeUtil {
    constructor(canvas) {
        this.three = {
            canvas: canvas, //canvas.transferControlToOffscreen
            renderer: undefined,
            composer: undefined,
            gui: undefined,
            controls:undefined,
            camera:undefined,
            scene:undefined
        };
        this.ANIMFRAMETIME = 0;

    }

    setup = () => { //setup three animation
        this.defaultSetup();
    }

    draw = () => { //frame draw function
        //do something
        this.defaultDraw();
        this.ANIMFRAMETIME = performance.now() - this.ANIMFRAMETIME;
        this.finished();
        this.ANIMFRAMETIME = performance.now();
    }

    finished = () => {
        let dict = {foo:'render',output:this.ANIMFRAMETIME,id:self.id};
        if(self.manager) {
            let emitevent = self.manager.checkEvents('render');
            if(emitevent) self.manager.events.emit('render',dict);
            else postMessage(dict);
        }
        else postMessage(dict);
    }

    clear = () => {
        this.defaultClear();
    }

    defaultSetup = () => {
        this.three.renderer = new THREE.WebGLRenderer( { canvas:this.three.canvas, antialias: true, alpha: true } );
        this.three.scene = new THREE.Scene();
        this.three.camera = new THREE.PerspectiveCamera(75, this.three.canvas.width / this.three.canvas.height, 0.01, 1000);
        this.three.controls = new OrbitControls(this.three.camera, this.three.renderer.domElement);
        this.three.composer = new EffectComposer(this.three.renderer.renderTarget);

        this.three.renderer.setAnimationLoop(this.draw);
    }

    defaultDraw = () => {

    }

    defaultClear = () => {
        
        this.three.renderer.setAnimationLoop( null );
        this.three.scene = null;
        this.three.renderer.domElement = null;
        this.three.renderer = null;
    }

};