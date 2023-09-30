
import { StateManager } from './ui/StateManager'
import { DOMFragment } from './ui/DOMFragment';

export class EventRouter{
    constructor(){
        this.device = null
        this.state = new StateManager()
        this.routes = {
            registry: {},
            reserve: {
                apps: {},
                pool: []
            }
        }
        this.apps = {}
        this.ui = []

        this.props = {
            id: String(Math.floor(Math.random()*1000000)),
            deviceSub: null
        }
    }

    init(device){
        this.device = device

        // Default EEG Controls

        if (!('states' in this.device)) this.device.states = {}

        // Blink 
        // TO DO: Check for All Frontal Electrodes
        if (this.device.info.deviceType === 'eeg'){
            this.device.states['blink_left'] = {data: 0, meta: {id:'blink_left'}}
            this.device.states['blink_right'] = {data: 0, meta: {id:'blink_right'}}
            this.device.states['blink_both'] = {data: 0, meta: {id:'blink_both'}}

            this.device.states['focus'] = {data: 0, meta: {id:'focus'}}


            let atlasTag = 'eeg'
            let prop = this.device.atlas.data.eegshared.eegChannelTags[0].tag
            let coord = this.device.atlas.getDeviceDataByTag('eeg', prop);
            this.props.deviceSub = atlasTag + "_" + prop
            this.state.addToState(this.props.deviceSub, coord, async () => {
                
                // Only Calculate if Required
                    let blinkBoth = Object.keys(this.routes.registry['blink_both'][1]).length !== 0
                    let blinkLeft = Object.keys(this.routes.registry['blink_left'][1]).length !== 0
                    let blinkRight = Object.keys(this.routes.registry['blink_right'][1]).length !== 0
                    let focus = Object.keys(this.routes.registry['focus'][1]).length !== 0


                    // Blink Detection
                    if (blinkBoth || blinkLeft || blinkRight){
                        let blinks = await this.device.atlas.getBlink({debug: true})
                        if (blinks){
                            if (blinkBoth) this.device.states['blink_both'].data = blinks.reduce((a,b) => a * b, true)
                            if (blinks[0] != null && blinkLeft) this.device.states['blink_left'].data = blinks[0]
                            if (blinks[1] != null && blinkRight) this.device.states['blink_right'].data = blinks[1]
                        }
                    } else {
                        // Turn Debug Off
                        let node = this.device.atlas.graph.getNode('blink')
                        if (node) node.updateParams({debug: false})
                    }

                    // Focus Detection
                    if (focus){
                        this.device.atlas.settings.analysisDetails.system['eegcoherence'] = true
                        this.device.states['focus'].data = this.device.atlas.getFocus({debug: true})
                    } else {
                        this.device.atlas.settings.analysisDetails.system['eegcoherence'] = false
                        let node = this.device.atlas.graph.getNode('focus')
                        if (node) node.updateParams({debug: false})
                    }
            });
        }


        if (this.device.states){
        Object.keys(this.device.states).forEach(key => {
                let states = this.device.states[key]
                if (states != null){
                    if (!Array.isArray(states)) states = [states]
                    states.forEach((state,i) => {

                        // Add to Event State
                        let splitId = state.meta.id.split('_')

                        // Create display label
                        let labelArr = splitId.map(str => str[0].toUpperCase() + str.slice(1))
                        state.meta.label = labelArr.join(' ')
                        
                        this.state.addToState(state.meta.id, state)
                        this.routes.registry[state.meta.id] = [state, {}]
                        // Route Switches in Atlas by Default
                        if (!(splitId[0] in this.device.atlas.data.states)) this.device.atlas.data.states[splitId[0]] = {}
                        if (splitId.length > 1) splitId.push('default')
                        if (!(splitId[1] in this.device.atlas.data.states[splitId[0]])) this.device.atlas.data.states[splitId[0]][splitId[1]] = state
                        else this.device.atlas.data.states[splitId[0]][splitId[1]].push(state)


                        // Declare Callback and Subscribe
                        let deviceCallback = (o) => {
                            this.update(o, this.routes.registry[state.meta.id])
                        }

                        this.state.subscribe(state.meta.id, deviceCallback)
                    })
                }
        })
    }
    }

    deinit = () => {
        this.state.removeState(this.props.deviceSub)
        if (this.ui) this.ui.forEach(frag => frag.deleteNode())
    }

    // Route Events to Atlas
    update(o,targets=[]) {

        let newState = o.data
        // Bit-Ify Continuous Inputs
        // TO DO: Modify based on expected inputs (binary or continuous)
        newState = newState > 0.5
        targets.forEach(t => {
            if (t){
                if ('ports' in t){
                    t.ports.default.set({data: newState, meta: {label: t.label}})
                }
            }
        })
    }

    // assign(state,){

    // }


    autoRoute = () => {
        let eventsToBind = Object.keys(this.routes.registry)

        // Remove Invalid Events
        eventsToBind = eventsToBind.filter(id => !(id.split('_')[1] == 0 && Object.keys(this.routes.registry).find(str => str.split('_')[0] === id.split('_')[0]) != null))

        // Preselect Events based on Keys
        let mappedRoutes = this.routes.reserve.pool.map(node => {

            let desired = node.name.split('_')
            desired = desired.map(s => new RegExp(`${s}`,'i'))
            
            // Match Keys (first is first)
            let pair
            desired.find((regex,i) => {
                let toRemove
                pair = eventsToBind.find((k1,j) => {
                    let current = k1.split('_')[i]
                    if (regex.test(current)){
                        toRemove = j
                        return true
                    }
                })

                // Remove Found Event
                if (pair) {
                    eventsToBind.splice(toRemove,1)
                    return true
                }
            })

            return {node, event: pair}
        })


        mappedRoutes.forEach(route => {

            let id
            // Grab Preselected Route if Necessary
            if (route.event != null){
                id = route.event
            } else if (eventsToBind.length > 0){
                id = eventsToBind.shift()
            }

            // Select Route if Possible
            if (id){

                let routes = this.routes.registry[id]
                // Replace If Not Already Assigned
                if (routes[1]==null || !("manager" in routes[1])){
                    routes[1] = route.node //newRoute.manager.data[newRoute.label]
                } else {
                    // newRoute.label = routes[1].label
                }

                let routeSelector = document.getElementById(`${this.id}brainsatplay-router-selector-${id}`)
                if (routeSelector != null) {
                    var opts = routeSelector.options;
                    for (var opt, j = 0; opt = opts[j]; j++) {
                        if (opt.value == route.node.name) {
                            routeSelector.selectedIndex = j;
                        break;
                        }
                    }
                }
            }
        })
    }

    removeMatchingRoutes(sources){
        for (let key in this.routes.registry){
            let routes = this.routes.registry[key]
            for (let i = routes.length - 1; i > -1; i--){
                if ('manager' in routes[i]){
                    Array.from(sources).find(o => {
                        if (routes[i].label === o.label) {
                            routes[i] = {}
                            return true
                        }
                    })
                }
            }
        }

    }

    updateRouteReserve = (id, controls=false) => {
        if (controls === false){
            this.removeMatchingRoutes(this.routes.reserve.apps[id]?.sources)
            delete this.routes.reserve.apps[id]
        } else {
            if (!(id in this.routes.reserve.apps)) this.routes.reserve.apps[id] = {
                // count: 0, 
                sources: new Set()}
                
            let oldSources = this.routes.reserve.apps[id].sources
            this.routes.reserve.apps[id].sources = new Set()

            controls.forEach(c => {
                // c.manager = controls.manager
                this.routes.reserve.apps[id].sources.add(c)
                oldSources.delete(c)
            })

            this.removeMatchingRoutes(oldSources)

            // this.routes.reserve.apps[id].count++
        }

        this.routes.reserve.pool = []
        for (let id in this.routes.reserve.apps){
            let sources = this.routes.reserve.apps[id].sources
            this.routes.reserve.pool.push(...sources)
        }
    }

    addControls = (parentNode=document.body) => {
        
        if (Object.keys(this.device.states).length > 0){
            let template = () => {
                return `
                <br>
                <div id='${this.id}routerControls' style="padding: 10px;">
                    <h4>Event Router</h4>
                    <hr>
                    <div class='brainsatplay-router-options' style="display: flex; flex-wrap: wrap;">
                    </div>
                </div>
                `;
            }

            let setup = () => {
                this.updateRouteDisplay()
            }

            this.ui.push(new DOMFragment(
                template,
                parentNode,
                undefined,
                setup
            ))
        }
    }

    addDebugger = (parentNode=document.body) => {
        
        if (Object.keys(this.device.states).length > 0){
            let template = () => {
                return `
                <br>
                <div id='${this.id}debugger' style="padding: 10px;">
                    <h4>Debugger</h4>
                    <hr>
                    <div class='brainsatplay-debugger' style="display: flex; flex-wrap: wrap;">
                    </div>
                </div>
                `;
            }

            this.ui.push(new DOMFragment(
                template,
                parentNode,
                undefined,
                () => {}
            ))
        }
    }

    addApp(id,controls){
        console.log('adding',id, controls)
        this.updateRouteReserve(id,controls)
    }

    removeApp(id){
        this.updateRouteReserve(id)
    }

    updateRouteDisplay(autoroute=true){

            let controls = document.getElementById(`${this.id}routerControls`)

            if (controls){
            let routerOptions = controls.querySelector('.brainsatplay-router-options')
            routerOptions.innerHTML = ''
            
            let infoMap = {}
            let selector = document.createElement('select')
            selector.insertAdjacentHTML('beforeend',`
            <option value="" disabled selected>Choose an event</option>
            <option value="none">None</option>
            `)

            this.routes.reserve.pool.forEach(node => {
                infoMap[node.name] = node

                let split = node.name.split('_')
                let uppercase = split.map(s => {return s[0].toUpperCase() + s.slice(1)}).join(' ')
                selector.insertAdjacentHTML('beforeend',`<option value="${node.name}">${uppercase}</option>`)           
            })

            Object.keys(this.state.data).forEach(id => {
                    let thisSelector = selector.cloneNode(true)

                    thisSelector.id = `${this.id}brainsatplay-router-selector-${id}`

                    thisSelector.onchange = (e) => {
                        try {
                            let target = infoMap[thisSelector.value]
                            if (target == null) target = {}
                            // Switch Route Target
                            if (this.routes.registry[id].length < 2) this.routes.registry[id].push(target)
                            else this.routes.registry[id][1] = target
                        } catch (e) {}
                    }
 

                    if ('meta' in this.state.data[id] && 'data' in this.state.data[id]){
                        let div = document.createElement('div')
                        div.style.padding = '10px'
                        div.insertAdjacentHTML('beforeend', `<p style="font-size: 80%;">${this.state.data[id].meta.label}</p>`)
                        div.insertAdjacentElement('beforeend', thisSelector)
                        routerOptions.insertAdjacentElement('beforeend',div)
                    }
            })
        
        if (autoroute){
            this.autoRoute()
        }
    }
    }
}