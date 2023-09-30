

export class Buzz {

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(info, graph, params={}) {
        
        
        

        this.props = {
            deviceSubscriptions: {},
            toUnsubscribe: {
                stateAdded: [],
                stateRemoved: []
            },
            device: null
        }

        this.ports = {
            motors: {
                input: {type: 'boolean'},
                output: {type: null},
                onUpdate: (user) => { 
                    if (this.props.device){  
                        // Check User Requests
                        if (user.data == true && user.id === this.session.info.auth.id){ // Run if you
                            let motorCommand = [this.ports.motor1.data,this.ports.motor2.data,this.ports.motor3.data,this.ports.motor4.data]
                            this.props.device.vibrateMotors([motorCommand,[0,0,0,0]])
                        }
                    }
                }

            },
            leds: {
                input: {type: 'boolean'},
                output: {type: null},
                onUpdate: (user) => {
                    if (this.props.device){
            
                        // Check User Requests
                        let c1 = [0,0,0]
                        let c2 = [0,0,0]
                        let c3 = [0,0,0]
                        if (user.data == true){
                            c1 = this._hexToRgb(this.ports.led1color.data)
                            c2 = this._hexToRgb(this.ports.led2color.data)
                            c3 = this._hexToRgb(this.ports.led3color.data)
                        }
                        
                        let ledColors = [c1,c2,c3]
                        let ledIntensities = [this.ports.led1intensity.data,this.ports.led2intensity.data,this.ports.led3intensity.data]
                        ledIntensities = ledIntensities.map(i => Number.parseFloat(i))
                        this.props.device.setLEDs(ledColors, ledIntensities)
                    }
                }
            },
            audioToMotors: {
                input: {type: Array}, // FFT
                output: {type: null},
                onUpdate: (user) => {
                    if (this.props.device)this.props.device.vibrateMotors([this.props.device.mapFrequencies(user.data)])
                }
            },
            mapOnBand: {
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    if (this.props.device){
                        if (user.data != false){
                            let position = (user.data == true) ? this.ports.position.data : user.data
                            let activations = this.props.device.getIllusionActivations(1,position)
                            this.props.device.vibrateMotors(activations)
                        }
                        this.props.device.vibrateMotors([0,0,0,0])
                    }
                }
            },
            fillLEDs: {
                input: {type: 'number'},
                output: {type: null},
                onUpdate: (user) => {
                    if (this.props.device){
            
                        let c1 = this._hexToRgb(this.ports.led1color.data)
                        let c2 = this._hexToRgb(this.ports.led2color.data)
                        let c3 = this._hexToRgb(this.ports.led3color.data)
                        
                        // Fills the Lights (Multi User)
                        let mean = user.data
            
                        let i1 = Math.min(mean/.33,1)
                        let i2 = (i1 === 1 ? Math.min((mean-.33)/.33,1) : 0)
                        let i3 = (i2 === 1 ? Math.min((mean-.66)/.33,1) : 0)
            
                        let ledColors = [c1,c2,c3]
                        let ledIntensities = [i1,i2,i3]
                        ledIntensities = ledIntensities.map(i => Number.parseFloat(i))
                        this.props.device.setLEDs(ledColors, ledIntensities)
                    }
                }
            },
            status: {
                edit: false,
                input: {type: null},
                output: {type: 'boolean'},
                onUpdate: () => {
                    return {data: (this.session.getDevice('buzz') != null)}
                }
            },

            motor1: {data: 1, min:0, max: 1, step: .01, onUpdate: (user) => {this.props.device.vibrateMotors([[user.data,0,0,0],[0,0,0,0]])}},
            motor2: {data: 1, min:0, max: 1, step: .01, onUpdate: (user) => {this.props.device.vibrateMotors([[0,user.data,0,0],[0,0,0,0]])}},
            motor3: {data: 1, min:0, max: 1, step: .01, onUpdate: (user) => {this.props.device.vibrateMotors([[0,0,user.data,0],[0,0,0,0]])}},
            motor4: {data: 1, min:0, max: 1, step: .01, onUpdate: (user) => {this.props.device.vibrateMotors([[0,0,0,user.data],[0,0,0,0]])}},
            led1color: {data: `#00ff00`, input: {type: 'color'}, output: {type: 'color'}, onUpdate: (user) => {this.ports.led1color.data = user.data; this.update( 'leds', {data: true, })}},
            led2color: {data: `#00ff00`, input: {type: 'color'}, output: {type: 'color'}, onUpdate: (user) => {this.ports.led2color.data = user.data; this.update( 'leds', {data: true, })}},
            led3color: {data: `#00ff00`, input: {type: 'color'}, output: {type: 'color'}, onUpdate: (user) => {this.ports.led3color.data = user.data; this.update( 'leds', {data: true, })}},
            led1intensity: {data: 0, min:0, max: 1, step: 0.01, onUpdate: (user) => {this.ports.led1intensity.data = user.data; this.update( 'leds', {data: true, })}},
            led2intensity: {data: 0, min:0, max: 1, step: 0.01, onUpdate: (user) => {this.ports.led2intensity.data = user.data; this.update( 'leds', {data: true, })}},
            led3intensity: {data: 0, min:0, max: 1, step: 0.01, onUpdate: (user) => {this.ports.led3intensity.data = user.data; this.update( 'leds', {data: true, })}},
            position: {data: 0, min: 0, max: 1, step: 0.01, onUpdate: (user) => {this.ports.position.data = user.data; this.update( 'mapOnBand', {data: true, })}},
        }
    }

    init = () => {
        this._setDevice()
        this.props.toUnsubscribe = this.session.subscribeToDevices('buzz', this._setDevice)
    }

    deinit = () => {
        for (let key in this.props.toUnsubscribe){
            this.update('status', {})
            this.session.state[this.props.toUnsubscribe[key].method](key,this.props.toUnsubscribe[key].idx)
        }
    }

    _setDevice = () => {
        this.props.device = this.session.getDevice('buzz')
        if (this.props.device != null) this.props.device = this.props.device.device.device
    }

    _hexToRgb = (hex) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16),parseInt(result[2], 16),parseInt(result[3], 16)] : [0,0,0];
    }

}