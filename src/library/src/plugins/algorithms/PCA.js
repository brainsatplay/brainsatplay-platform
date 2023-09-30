import {Math2} from '../../utils/mathUtils/Math2'


export class PCA {

    static id = String(Math.floor(Math.random()*1000000))
    static hidden = true

    constructor(info, graph, params={}) {
        
        
        
        

        this.ports = {
            data: {
                input: {type: undefined},
                output: {type: undefined},
                onUpdate: (user) => {
                    user.forEach((u,i) => {
                        console.log(u.username,u.data,u.meta,u, Math2)
                        let components = Math2.pca(u.data) // Get Principal Components
                        u.data = components[this.ports.numComponenents.data]
                    })
                    return user
                }
            },
            numComponenents: {
                data: 5,
                input: {type: 'number'},
                output: {type: undefined},
                onUpdate: (user) => {
                    this.ports.numComponents.data = user.data
                }
            }
        }
    }

    init = () => {}

    deinit = () => {}
}