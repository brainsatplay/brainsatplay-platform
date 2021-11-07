
import {createCards} from './browserUtils'

//Example Applet for integrating with the UI Manager
export class AppletBrowser {

    static id = String(Math.floor(Math.random()*1000000))
    
    constructor(info, graph) {
        
        this.props = { //Changes to this can be used to auto-update the HTML and track important UI values 
            id: String(Math.floor(Math.random() * 1000000)), //Keep random ID,
            trainingModules: {},
            applets: [],
            presets: []
        };

        this.props.container = document.createElement('div')
        this.props.container.id = this.props.id
        this.props.container.classList.add('brainsatplay-browser')

        this.ports = {
            element: {
                data: this.props.container,
                input: {type: null},
                output: {type: 'Element'}
            }
        }


        // Default Configuration Settings 
        // this.appletToReplace = 0
        this.showPresets = true
        this.showApplets = true
        this.displayMode = 'default'
    }

    //---------------------------------
    //---Required template functions---
    //---------------------------------

    //Initalize the app with the DOMFragment component for HTML rendering/logic to be used by the UI manager. Customize the app however otherwise.
    init = () => {}

    //Delete all event listeners and loops here and delete the HTML block
    deinit = () => {
        this.props.trainingModule.deinit()
    }

    configure = (settings = []) => { //For configuring from the address bar or saved settings. Expects an array of arguments [a,b,c] to do whatever with
        settings.forEach((cmd, i) => {
            if (cmd.appletIdx != null) this.appletToReplace = cmd.appletIdx
            if (cmd.showPresets != null) this.showPresets = cmd.showPresets
            if (cmd.showApplets != null) this.showApplets = cmd.showApplets 
            if (cmd.displayMode != null) this.displayMode = cmd.displayMode

            if (cmd.applets != null) this.props.applets = cmd.applets
            if (cmd.presets != null) this.props.presets = cmd.presets
        });

        this._createBrowser()
    }

    _createBrowser(){
                // if (this.settings.length > 0) { this.configure(this.settings); } //you can give the app initialization settings if you want via an array.

                if (this.showPresets) {this._createFeature()}

                // this._createTraining() // TODO: Actually Implement Training
        
                // Create Library Section (dependent on platform)
                let onclickInternal = (element, settings) => {
                    let selector = document.getElementById(`applet${0}`) // this.appletToReplace
                    selector.value = settings.name
                    window.history.pushState({ additionalInformation: 'Updated URL from Applet Browser (applet)' }, '', `${window.location.origin}/#${settings.name}`)
                    selector.onchange()
                }

                let library = [], community = []
                this.props.applets.forEach(a => {
                    if (a.categories.includes('External')) community.push(a)
                    else library.push(a)
                })

                // publishedApps = await this.session.projects.getPublishedApps()
                if (community.length > 0) this._createSection('Community', community, onclickInternal)//, onclickCommunity) 
                this._createSection('Library', library, onclickInternal)
    }

    _createFeature = () => {
        let presetEl = document.createElement('div')
        presetEl.classList.add('preset-container')
        this.props.container.insertAdjacentElement('beforeend', presetEl)
        this.props.presets.forEach(preset => {

            let presetCard = document.createElement('div')
            presetCard.classList.add(`browser-card`)
            presetCard.classList.add(`preset`)
            presetCard.id = `${this.props.id}-${preset.value}`
            presetCard.innerHTML = `<div class="info">
            <div>
                <h2 style="margin-bottom: 5px;">${preset.name}</h2>
                <p style="font-size: 80%; margin: 15px 0px 20px 0px;">${preset.description}</p>
            </div>
            <span style="position: absolute; bottom: 10px; right: 10px; font-size: 60%;margin-top: 5px;">Tags: ${preset.type}</span>
            </div>
            <img src="${preset.image}">`

            presetEl.insertAdjacentElement('beforeend', presetCard)
            presetCard.onclick = (e) => {
                let selector = document.getElementById('preset-selector')
                selector.value = preset.value
                selector.onchange()
            }
        })

        return
    }

    _createTraining = () => {
        // Training Prompts
        let trainingHeader = document.createElement('div')
        trainingHeader.innerHTML = `
        <div id="${this.props.id}-trainingheader" class="browser-header">
            <h1>Training</h1>
        </div>
        `
        this.props.container.insertAdjacentElement('beforeend', trainingHeader)

        let trainingContainer = document.createElement('div')
        trainingContainer.id = `${this.props.id}-trainingsection`
        trainingContainer.classList.add(`applet-container`)

        this.props.container.insertAdjacentElement('beforeend', trainingContainer)

        let trainingModes = [
            'Blink', 
            'Motor Imagery', 
            // 'SSVEP', 
            // 'P300'
        ]

        let settings = {
            name: 'Training Prompt',
            graphs: [{
                nodes: [],
                edges: []
            }]
        }

        // Training Selection
        trainingModes.forEach((mode, i) => {
            settings.graphs[0].nodes.push({ name: mode, class: 'Train', params: { mode , applets: this.props.applets} })
            settings.graphs[0].nodes.push({ name: `${mode}ui`, class: 'DOM', params: { style: `div {flex-grow: 1;}`, parentNode: trainingContainer } })
            settings.graphs[0].edges.push({ source: `${mode}:element`, target: `${mode}ui:content` })
        })

        this.props.trainingModule = new brainsatplay.App(settings, trainingContainer, this.session)
        this.props.trainingModule.init()
        trainingContainer.style.padding = 0
    }

    _createSection = async (name, apps, onclick=()=>{}) => {

        let filter
        let appletInfo = await createCards(apps, filter, onclick)

        let randomId = this.session.atlas._getRandomId()

        let header = document.createElement('div')
        header.classList.add('browser-header')

        let section = document.createElement('div')
        section.classList.add('applet-container')


        header.insertAdjacentHTML('beforeend',
            `
            <h1>${name}</h1>
            <div style="padding: 0px 25px;  width: 100%; display: flex; margin: auto;">
                
            <div style="margin: 5px; flex-grow: 1;">
            <p style="font-size: 80%; margin-bottom: 5px;">Device</p>
                <select id="${this.props.id}-devices" style="max-height: 30px; width: 100%;">
                    <option value="all" selected>All</option>
                </select>
            </div>
            <div style="margin: 5px; flex-grow: 1;"">
                <p style="font-size: 80%; margin-bottom: 5px;">Category</p>
                <select id="${this.props.id}-categories" style="max-height: 30px; width: 100%;">
                    <option value="all" selected>All</option>
                </select>
                </div>
            </div>
        `)

        this.props.container.insertAdjacentElement('beforeend', header)
        this.props.container.insertAdjacentElement('beforeend', section)

        let categoryArray = []
        let deviceArray = []
        appletInfo.forEach(o => {
            section.insertAdjacentElement('beforeend', o.element)
            let categories = o.element.getAttribute('categories')
            categoryArray.push(...categories.split(','))
            let devices = o.element.getAttribute('devices')
            deviceArray.push(...devices.split(','))
        })

        // Category Filter
        function onlyUnique(value, index, self) {
            return self.indexOf(value) == index;
        }

        categoryArray = categoryArray.map(c => c.charAt(0).toUpperCase() + c.slice(1))
        let uniqueCategories = categoryArray.filter(onlyUnique);
        let categorySelector = header.querySelector(`[id="${this.props.id}-categories"`)
        uniqueCategories.forEach(category => {
            categorySelector.innerHTML += `<option value="${category}">${category}</option>`
        })

        categorySelector.onchange = (e) => {
            this.filterApplets(header, section)
        }

        // Device Filter
        let uniqueDevices = deviceArray.filter(onlyUnique);
        let deviceSelector = header.querySelector(`[id="${this.props.id}-devices"]`)
        uniqueDevices.forEach(device => {
            deviceSelector.innerHTML += `<option value="${device}">${device.charAt(0).toUpperCase() + device.slice(1)}</option>`
        })

        deviceSelector.onchange = (e) => {
            this.filterApplets(header, section)
        }
    }


    filterApplets(header, section) {
        let divs = section.querySelectorAll('.browser-card')
        let selectors = header.querySelectorAll('select')

        let attributes = []
        let values = []
        for (let selector of selectors) {
            attributes.push(selector.id.split('-')[1])
            values.push(selector.value)
        }

        for (let div of divs) {
            let votes = 0;
            attributes.forEach((a, i) => {
                if (div.getAttribute(a).toLowerCase().includes(values[i].toLowerCase()) || values[i].toLowerCase() === "all") {
                    votes++
                }
            })
            if (votes === attributes.length) {
                div.style.display = "block"
            } else {
                div.style.display = "none"
            }
        }

    }
} 