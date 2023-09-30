

export class Buffer {

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(info, graph, params={}) {
        
        
        

        this.ports = {
            default: {
                output: {type: Array},
                onUpdate: (user) => {
                    this.props.buffer.push(user.data)
                    if (this.props.buffer.length > this.ports.size.data) this.props.buffer.shift()
                    user.data = this.props.buffer
                    return user
                }
            },
            size: {data: 500, min: 1, max: 2500, step: 1, input: {type: 'number'}, output: {type: null}},

        }

        this.props = {
            looping: false,
            buffer: []
        }
    }

    init = () => {
        this.props.buffer = []
    }

    deinit = () => {
        this.props.looping = false
    }
}