import {Spectrogram as SpectrogramHelper} from '../../utils/graphics/eegvisuals'



export class Spectrogram {

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(info, graph, params={}) {
        
        
        
        

        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            canvas: document.createElement('canvas'),
            helper: null,
            looping: false
        }

        this.props.canvas.onresize = this.responsive

        this.ports = {
            data: {
                edit: false,
                input: {type: Array},
                output: {type: null},
                onUpdate: (user) => {
                    this.props.helper.latestData = user.data
                    this.props.helper.draw();
                }
            },
            atlas: {
                analysis: ['eegcoherence'],
                edit: false,
                input: {type: Object, name: 'DataAtlas'},
                output: {type: null},
                onUpdate: (user) => {
                    user.data.eegshared.eegChannelTags.find((o,i) => {
                    if(o.ch === 0){ // first channel
                        let tag = o.tag;
                        var coord = this.session.atlas.getEEGDataByTag(tag);
                        if(coord.ffts.length > 1) {
                            this.props.helper.latestData = [...coord.ffts[coord.ffts.length - 1]];
                            this.props.helper.draw();
                        }
                        return true;
                    }
                    });
                    // this.props.helper.latestData = user.data
                    // this.props.helper.draw();
                }
            },
            element: {
                data: this.props.canvas,
                input: {type: null},
                output: {type: Element},
                onUpdate: () => {
                    return {data: this.props.canvas}
                }
            }
        }
    }

    init = () => {
        this.props.helper = new SpectrogramHelper(this.props.canvas);
        this.props.helper.init();
    }

    deinit = () => {
        this.props.canvas.remove()
        this.props.helper.deInit();
        this.props.helper = null;
    }

    responsive = () => {

        // Resize to parent
        if (this.props.helper){
            this.props.helper.canvas.width = this.props.helper.canvas.parentNode.clientWidth;
            this.props.helper.canvas.height = this.props.helper.canvas.parentNode.clientHeight;
            this.props.helper.canvas.style.width = this.props.helper.canvas.parentNode.clientWidth;
            this.props.helper.canvas.style.height = this.props.helper.canvas.parentNode.clientHeight;
            this.props.helper.init();
        }
        // this.props.helper.draw();

    }
}