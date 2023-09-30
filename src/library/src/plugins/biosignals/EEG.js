export class EEG {
    
    static id = String(Math.floor(Math.random()*1000000))

    constructor(info, graph, params={}) {

        this.session = graph.app.session

        this.props = {
            deviceSubscriptions: [],
            toUnsubscribe: {
                stateAdded: [],
                stateRemoved: []
            },
            deviceState: null,
            // sps: null,
            // tags: null
        }

        this.ports = {
            atlas: {
                data: this.session.atlas.data,
                edit: false,
                input: {type:null},
                output: {type: Object, name: 'DataAtlas'},
                onUpdate: () =>{
                    return {data: this.session.atlas.data}
                }
            },
            status: {
                edit: false,
                input: {type: null},
                output: {type: 'boolean'},
                onUpdate: () => {
                    return {data: (this.session.getDevice('eeg') != null)}
                }
            }
        }

        let keys = ['raw','filtered', 'position', 'voltage']

        // Auto-Generate Ports
        keys.forEach(key => {
            this.ports[key] = {
                edit: false,
                input: {type:null},
                output: {type:Array},
                onUpdate: (user) => {
                    let data = []
                    this.session.atlas.data.eeg.forEach(coord => {
                        if (key === 'position') data.push([coord[key].x, coord[key].y, coord[key].z])
                        else if (key === 'voltage') data.push(coord.filtered[coord.count-1] ?? coord.raw[coord.count-1])
                        else data.push(coord[key])
                    })
                    return {data}
                }
            }

            // if (key === 'position') this.ports[key].output.type = 'position'
            // else this.ports[key].output.type = Array
        })
    }

    init = () => {
        this.props.toUnsubscribe = this.session.subscribeToDevices('eeg', (data) => {
            this.updateAll()
        })
    }

    deinit = () => {
        for (let key in this.props.toUnsubscribe){
            this.update('status', {})
            this.session.state[this.props.toUnsubscribe[key].method](key,this.props.toUnsubscribe[key].idx)
        }
    }
}