import {SoundJS} from '../../utils/general/Sound'



export class Audio {
    
    static id = String(Math.floor(Math.random()*1000000))

    constructor(info, graph, params={}) {

        this.props = {
            sourceGain: null,
            sourceNode: null,
            status: 0,
            maxVol: 0.5,
            file: null
        }

        if(!window.audio) window.audio = new SoundJS();

        this.ports = {
            file: {
                input: {type: 'file', accept:'audio/*'}, // Single file only
                output: {type: 'boolean'},
                // data: [],
                onUpdate: async (user) => {
                    return new Promise(async (resolve, reject) => {

                        if (user.data){
                            this._deinit()
                            let file = user.data
                            if (file instanceof FileList || Array.isArray(file)) file = file[0]
                            this.props.file = file

                            if (this.props.file){
                                if (typeof this.props.file === 'string'){
                                    await this._convertToBlob(this.props.file)
                                    // reject()
                                } else {
                                    this.decodeAudio(this.props.file, () => {
                                        console.log('decoded')
                                        resolve({data: true}) 
                                    })
                                }
                            }
                        }
                    })
                }
            }, 
            fft: {
                input: {type: null},
                output: {type: Array},
                onUpdate: () => {
                    var array = new Uint8Array(window.audio.analyserNode.frequencyBinCount);
                    window.audio.analyserNode.getByteFrequencyData(array);
                }
            },
            volume: {
                input: {type: 'number'},
                output: {type: null},
                data: this.props.maxVol,
                min: 0,
                max: this.props.maxVol,
                step: 0.01,
                onUpdate: (user) => {
                    let volume = user.data*this.props.maxVol
                    this.props.sourceGain.gain.setValueAtTime(volume, window.audio.ctx.currentTime);
                }
            },
            toggle: {
                // input: {type: 'boolean'},
                output: {type: null},
                onUpdate: (user) => {
                    if (user.data){
                        this.triggerAudio()
                    }
                }
            }
        }
    }

    init = () => {

    }

    _convertToBlob = async (str) => {
        await fetch(str).then(r => r.blob()).then(blobFile => {
            let name = str.split('/')
            name = name[name.length -1]
            this.update('file', {data: false})
            let file = new File([blobFile], name)
            this.update('file', {data: [file]})
            // this.ports.file.onUpdate({data: [file]})
        })
    }

    _deinit = () => {
        this.endAudio();
    }

    deinit = () => {
        this._deinit()
    }

    // preload = () => {

    // }

    decodeAudio = (file, callback= () => {}) => {

        return new Promise(resolve => {
        //read and decode the file into audio array buffer 
        var fr = new FileReader();

        fr.onload = (e) => {
            var fileResult = e.target.result;
            if (window.audio.ctx === null) {
                return;
            };

            let createAudio = () => {
                window.audio.ctx.decodeAudioData(fileResult, (buffer) => {

                    let onDecode = () => {
                        window.audio.finishedLoading([buffer]);
                        this.props.sourceNode = window.audio.sourceList[window.audio.sourceList.length-1];
                        this.props.sourceGain = window.audio.sourceGains[window.audio.sourceList.length-1];

                        this.props.sourceGain.gain.setValueAtTime(this.props.maxVol, window.audio.ctx.currentTime);

                        this.props.sourceNode.onended = () => {
                            if (this.props.status === 1){
                                this.endAudio()
                                this.decodeAudio(this.props.file)
                            }
                        };

                        resolve()
                    }

                    onDecode()
                    callback()
                }, (e) => {
                    console.error('Failed to decode the file!', e);
                });
            }
            createAudio()

        };
        fr.onerror = (e) => {
            console.error('Failed to read the file!', e);
        };
        //assign the file to the reader
        fr.readAsArrayBuffer(file);
    })
    }

    triggerAudio = async () => {
        
        if (this.props.sourceNode){
            if (this.props.status === 1){
                this._deinit()
                await this.decodeAudio(this.props.file)
            }

            this.props.sourceNode.start(0);
            this.props.status = 1
        }
    }
        
    endAudio = () => {
            this.stopAudio();
            this.props.status = 0;
            if(window.audio.sourceList.length > 0) {try {
                this.sourceNode.stop(0);
            } catch(er){}}
    }

    stopAudio = () => {
        if(window.audio != undefined){
            if (window.audio?.sourceList?.length > 0 && this.props.sourceNode && this.props.status === 1) {
                try {this.props.sourceNode.stop(0)} catch(er){}
            }
        }
    }
}