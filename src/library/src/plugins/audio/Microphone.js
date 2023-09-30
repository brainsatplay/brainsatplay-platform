import {SoundJS} from '../../utils/general/Sound'
import {Math2} from '../../utils/mathUtils/Math2'




export class Microphone {
    
    static id = String(Math.floor(Math.random()*1000000))

    constructor(info, graph, params={}) {
        
        
        
        

        this.ports = {
            fft: {
                data: [],
                input: {type: null},
                output: {type: Array},
                onUpdate: () => {
                    let audioDat = [];

                    // Get Audio
                    if(window.audio){
                        var array = new Uint8Array(window.audio.analyserNode.frequencyBinCount); //2048 samples
                        window.audio.analyserNode.getByteFrequencyData(array);
                        audioDat = this._reduceArrByFactor(Array.from(array),4);
                    } else {
                        audioDat = new Array(256).fill(0);
                    }
                    return {data: audioDat, meta: {}}
                }
            }, 
        }

        this.props = {
            mic: null,
            looping: false,
            fxStruct: {},
        }
    }

    init = () => {
        if(!window.audio) window.audio = new SoundJS();
        if (window.audio.ctx===null) {return;};

        let fx = JSON.parse(JSON.stringify(this.props.fxStruct));

        fx.sourceIdx = window.audio.record(undefined,undefined,null,null,false,()=>{
            if(fx.sourceIdx !== undefined) {
                fx.source = window.audio.sourceList[window.audio.sourceList.length-1];
                fx.playing = true;
                fx.id = 'Micin';
                this.props.hostSoundsUpdated = false;
            }
        });

        this.props.mic = fx

        window.audio.gainNode.disconnect(window.audio.analyserNode);
        window.audio.analyserNode.disconnect(window.audio.out);
        window.audio.gainNode.connect(window.audio.out);

        this.props.looping = true
        let animate = () => {
            if (this.props.looping){
                this.update('fft',{data: true})
                setTimeout(() => {animate()}, 1000/60)
            }
        }
        animate()

    }

    deinit = () => {
        this.props.mic.source.mediaStream.getTracks()[0].stop();
        window.audio.gainNode.disconnect(window.audio.out);
        window.audio.gainNode.connect(window.audio.analyserNode);
        window.audio.analyserNode.connect(window.audio.out);
        
        this.props.looping = false
    }

    _reduceArrByFactor(arr,factor=2) { //faster than interpolating
        let x = arr.filter((element, index) => {
            return index % factor === 0;
        });
        return x;
    }
}