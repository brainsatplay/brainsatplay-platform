
export class DOM {

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(info, graph) {
        
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),
            canvas: null,
            container: document.createElement('div'),
            context: null,
            drawFunctions: {},
            looping: false,
            fragment: null,
            onload: [],
            onresize: {},
            portsAdded: []
        }

        this.ports = {
            element: {
                input: {type: null},
                output: {type: Element},
                data: document.createElement('div'),
                onUpdate: () => {
                    return {data: this.props.container}
                },
            },
             opacity: {
                input: {type:'number'},
                output: {type: null},
                data: 1,
                min: 0,
                max: 1,
                step: 0.01,
                onUpdate:(user) => {
                    let val = user.data
                    this.props.container.style.opacity = val
                }
             },
             containerStyle: {},
             setupHTML: {},
             parentNode: {},
        }

        // Dynamically Add Ports
        let ports = [
            {key: 'html', input: {type: 'HTML'}, output: {type: null}, data: `<div id='content'></div>`, onUpdate: (user) => {
                
                // Create New HTML
                let newContainer = document.createElement('div')
                newContainer.insertAdjacentHTML('beforeend', user.data)

                // Check top-level children for active elements from other parts of the graph
                for (let el of newContainer.children){
                    if (el.id) {
                        let match = this.props.container.querySelector(`[id="${el.id}"]`)
                        if (el.innerHTML === '' && match){
                                let hasDescendentFromGraph = match.getAttribute('data-active')
                                if (hasDescendentFromGraph) {
                                    el.setAttribute('data-active', true)
                                    el.innerHTML =  match.innerHTML // pass if exists
                                }
                            }
                        }
                    }

                // Swap New and Old (if different)
                if (this.props.container.innerHTML != newContainer.innerHTML) this.props.container.innerHTML = newContainer.innerHTML
                
                // Create ID Ports
                let currentIds = []
                let checkToCreatePorts = (node) => {

                    // Find Descendents with ID
                    let descendentHasId = false
                    let isPassed = node.parentNode.getAttribute('data-active') // ignore passed elements

                    if (node.id) Array.from(node.querySelectorAll("*")).forEach(el => {if (el.id != null) descendentHasId = true})

                    if (node.id && descendentHasId != true){

                        currentIds.push(node.id)

                        if (!this.props.portsAdded.includes(node.id) && isPassed != true){

                            this.props.portsAdded.push(node.id)

                            this.addPort(node.id, {
                                edit: false,
                                input: {type: undefined},
                                output: {type: null},
                                onUpdate: (user) => {
                                    let data = user.data
                                    if (data instanceof Function) data = data()

                                    node.innerHTML = ''
                                    if (
                                        typeof data === "object" ? data instanceof HTMLElement : //DOM2
                                        data && typeof data === "object" && data !== null && data.nodeType === 1 && typeof data.nodeName==="string"
                                    ) {
                                        node.insertAdjacentElement('beforeend', data)
                                        node.setAttribute('data-active', true)

                                        let newStr = this.ports.style.data.replace(new RegExp(`\n\n#${node.id} {[^}]+}`), ``)
                                        this.update( 'style', {data: newStr + `\n\n#${node.id} {\n\twidth: 100%;\n\theight: 100%;\n}`})

                                        setTimeout(() => {
                                            if (data.onload instanceof Function) data.onload()
                                            if (data.onresize instanceof Function) {
                                                this.props.onresize[node.id] = data.onresize
                                                this.responsive()
                                            }
                                        },250) // Wait a bit for onload functions to ensure element has been added
                                    }
                                    else node.insertAdjacentHTML('beforeend', String(data))
                                }
                            })
    
                        } else if (!this.ports.style.data.includes(`#${node.id}`)) this.update( 'style', {data: this.ports.style.data + `\n\n#${node.id} {\n\t\n}`})
                                                
                    } else {
                        if (isPassed) currentIds.push(node.parentNode.id)
                        else for (let child of node.children) checkToCreatePorts(child) // iterate all children
                    }
                }

                // Create Ports
                for (let node of this.props.container.children){
                    checkToCreatePorts(node)
                }
                
                // Remove Extraneous Ports
                this.props.portsAdded = this.props.portsAdded.filter(id => {
                    if (!currentIds.includes(id)) {
                        this.removePort(id)
                        return false
                    } return true
                })
            }}, 
            // {key: 'parentNode', input: {type: Element}, output: {type: null}, data: document.body}, 
            {key: 'style', input: {type: 'CSS'}, output: {type: null}, data: `.brainsatplay-ui-container {\n\twidth: 100%;\n\theight: 100%;\n}`, onUpdate: (user) => {
                
                if (this.app.ui.manager){ // Wait for HTML to Exist
                    if (this.props.style == null){
                        this.props.style = document.createElement('style')
                        this.props.style.id = `${this.props.id}style`
                        this.props.style.type = 'text/css';
                        this.app.ui.manager.appendStylesheet(() => {return this.props.style});
                    }

                    // Scope the CSS (add ID scope)
                    if (user.data){
                        let styleArray = user.data.split(/[{}]/).filter(String).map(function(str){
                            return str.trim(); 
                        });

                        let newStyle = ``
                        for (let i = 0; i < styleArray.length - 1; i+=2){
                            if (styleArray[i].includes('.brainsatplay-ui-container')) newStyle += `[id='${this.props.id}']` // styleArray[i+1]
                            else newStyle += `[id='${this.props.id}'] ${styleArray[i]} `
                            newStyle +=`{\n\t${styleArray[i+1]}\n}\n\n`
                        }

                        this.props.style.innerHTML = newStyle
                    }
                }
            }}, 
            {key: 'deinit', input: {type: Function}, output: {type: undefined}, data: ()=>{}}, 
            {key: 'responsive',input: {type: Function}, output: {type: null}, data: ()=>{}}
        ]

        ports.forEach(o => {

            this.ports[o.key] = {
                input: o.input,
                output: o.output,
                data: o.data,
                onUpdate: (user) => {
                    if (o.onUpdate) o.onUpdate(user)
                    return user
                }
            }
            
            if (o.edit === false) this.ports[o.key].edit = false
        })

    }

    init = () => {

        this.props.container.id = this.props.id
        this.props.container.classList.add('brainsatplay-ui-container')
        this.props.container.style = this.ports.containerStyle.data
        this.update('html', {data: this.ports.html.data})

        // Create Stylesheet
        let HTMLtemplate = this.props.container

        let setupHTML = () => {
            if (this.ports.setupHTML.data instanceof Function) this.ports.setupHTML.data()
            // Wait to Reference AppletHTML
            setTimeout(() => {
                if (this.ports.style.data) this.update('style', {data: this.ports.style.data})
            }, 250)
        }

        this.fragment = this.app.createFragment(
            HTMLtemplate,
            this.app.ui.container, 
            this.props,       
            setupHTML,        
            undefined,
            "NEVER", 
            undefined,
            this.responsive
        )
    }

    deinit = () => { 
        this.fragment.deleteNode()
        if (this.ports.deinit.data instanceof Function) this.ports.deinit.data()
        if (this.props.style != null) this.props.style.remove()
    }

    responsive = () => {
        if (this.ports.responsive.data instanceof Function) this.ports.responsive.data()
       for (let key in this.props.onresize){
           this.props.onresize[key]()
       }
    }
}