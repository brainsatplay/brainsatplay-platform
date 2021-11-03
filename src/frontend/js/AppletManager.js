import {presetManifest} from '../presetManifest'
import {appletManifest} from '../../apps/apps'
import { getApplet, getAppletSettings } from "./utils/importUtils"
import {handleAuthRedirect} from './utils/login'

//By Garrett Flynn, Joshua Brewster (GPL)

export class AppletManager {
    /**
     * @constructor
     * @alias AppletManager
     * @description Main container for WebBCI applets.
     */
    constructor(initUI = () => { }, deinitUI = () => { }, appletConfigs = [], appletSelectIds = [], bcisession = new brainsatplay.Session()) {
        this.initUI = initUI;
        this.deinitUI = deinitUI;
        this.initUI();

        this.appletsSpawned = 0;
        this.appletConfigs = appletConfigs;

        // Layout Constraints
        if (!window.isMobile) {
            this.maxApplets = 16;
        } else {
            this.maxApplets = 1;
        }

        if (appletSelectIds.length === 0 && Array.isArray(appletSelectIds)){
            appletSelectIds = Array.from({length: this.maxApplets}, (e,i) => `applet${i}`)
        }

        this.layoutTemplates = {
            'Focus': {
                maxApplets: 6,
                generate: (labels) => {
                    let rows = 3
                    let bottomCols = labels.active.length - 1
                    return Array.from({ length: rows }, e => []).map((a, i) => {
                        if (bottomCols > 0) {
                            if (i < rows - 1) {
                                for (let j = 0; j < bottomCols; j++) a.push(labels.active[0])
                            } else {
                                for (let j = 0; j < bottomCols; j++) a.push(labels.active[j + 1])
                            }
                        } else {
                            a.push(labels.active[0])
                        }
                        return a
                    })
                }
            },
            'Grid': {
                maxApplets: 16,
                generate: (labels) => {
                    let layout;
                    let gridResolution = 2

                    let repeatForGridResolution = (layout, resolution) =>{
                        layout = layout.map((row,i) => {
                            let newRow = row.map((col,j) => {
                                return Array.from({length: resolution}, e => col)
                            })
                            return Array.from({length: resolution}, e => newRow.flat())
                        })
                        return layout.flat()
                    }

                    let rows = Math.ceil(Math.sqrt(labels.active.length))*gridResolution
                    if (labels.active.length == 0) layout = [[]]
                    if (labels.active.length == 1) layout = repeatForGridResolution([[`a`]],gridResolution)
                    if (labels.active.length == 2) layout = repeatForGridResolution([[`a`,`b`]],gridResolution)
                    if (labels.active.length == 3) layout = repeatForGridResolution([[`a`,`b`], [`c`,`c`]],gridResolution)
                    if (labels.active.length == 4) layout = repeatForGridResolution([[`a`,`b`], [`c`,`d`]],gridResolution)
                    if (labels.active.length == 5) layout = repeatForGridResolution([[`a`,`d`], [`a`,`d`], [`b`,`d`], [`b`,`e`], [`c`,`e`],[`c`,`e`]],gridResolution)
                    if (labels.active.length == 6) layout = repeatForGridResolution([[`a`,`b`,`c`], [`d`,`f`,`f`], [`e`,`f`,`f`]],gridResolution)
                    if (labels.active.length == 7) layout = repeatForGridResolution([[`a`,`b`,`c`], [`d`,`e`,`f`], [`g`,`g`,`g`]],gridResolution)
                    if (labels.active.length == 8) layout = repeatForGridResolution([[`a`,`a`,`b`,`b`,`c`,`c`], [`d`,`d`,`e`,`e`,`f`,`f`], [`g`,`g`,`g`,`h`,`h`,`h`]],gridResolution)
                    if (labels.active.length == 9) layout = repeatForGridResolution([[`a`,`b`,`c`], [`d`,`e`,`f`], [`g`,`h`,`i`]],gridResolution)
                    if (labels.active.length == 10) layout = repeatForGridResolution([[`a`,`b`,`c`,`d`], [`e`,`f`,`g`,`h`], [`i`,`i`,`j`,`j`]],gridResolution)
                    if (labels.active.length == 11) layout = repeatForGridResolution([[`a`,`a`,`a`,`b`,`b`,`b`,`c`,`c`,`c`,`d`,`d`,`d`], 
                                                                                      [`e`,`e`,`e`,`f`,`f`,`f`,`g`,`g`,`g`,`h`,`h`,`h`], 
                                                                                      [`i`,`i`,`i`,`i`,`j`,`j`,`j`,`j`,`k`,`k`,`k`,`k`]],gridResolution)
                    if (labels.active.length == 12) layout = repeatForGridResolution([[`a`,`b`,`c`,`d`], [`e`,`f`,`g`,`h`], [`i`,`j`,`k`,`l`]],gridResolution)
                    if (labels.active.length == 13) layout = repeatForGridResolution([[`a`,`b`,`c`,`d`], [`e`,`f`,`g`,`h`], [`i`,`j`,`m`,`m`], [`k`,`l`,`m`,`m`]],gridResolution)
                    if (labels.active.length == 14) layout = repeatForGridResolution([[`a`,`b`,`c`,`d`], [`e`,`f`,`g`,`h`], [`i`,`j`,`k`,`l`],[`m`,`m`,`n`,`n`]],gridResolution)
                    if (labels.active.length == 15) layout = repeatForGridResolution([[`a`,`a`,`a`,`b`,`b`,`b`,`c`,`c`,`c`,`d`,`d`,`d`], 
                                                                                      [`e`,`e`,`e`,`f`,`f`,`f`,`g`,`g`,`g`,`h`,`h`,`h`], 
                                                                                      [`i`,`i`,`i`,`j`,`j`,`j`,`k`,`k`,`k`,`l`,`l`,`l`],
                                                                                      [`m`,`m`,`m`,`m`,`n`,`n`,`n`,`n`,`o`,`o`,`o`,`o`]],gridResolution)
                    if (labels.active.length == 16) layout = repeatForGridResolution([[`a`,`b`,`c`,`d`], [`e`,`f`,`g`,`h`], [`i`,`j`,`k`,`l`], [`m`,`n`,`o`,`p`]],gridResolution)
                //     else {
                //     let layout = Array.from({ length: rows }, e => []).map((a, i) => {
                //         for (let j = 0; j < rows; j++) {
                //             a.push(labels.all[rows * (i) + j])
                //         }
                //         return a
                //     })

                //     let getReplacementLabel = ({ active, inactive, all }, baseLayout, i, j) => {
                //         if (active.includes(baseLayout[i][j - 1])) return baseLayout[i][j - 1]
                //         if (active.includes(baseLayout[i][j + 1])) return baseLayout[i][j + 1]
                //         if (baseLayout[i - 1] != null && active.includes(baseLayout[i - 1][j])) return baseLayout[i - 1][j]
                //         if (baseLayout[i + 1] != null && active.includes(baseLayout[i + 1][j])) return baseLayout[i + 1][j]
                //         else return labels.active.shift()
                //     }

                //     layout = layout.map((row, i) => {
                //         return row.map((val, j) => {
                //             if (labels.inactive.includes(val)) { // Replace inactive applets
                //                 return getReplacementLabel(labels, layout, i, j) ?? val
                //             }
                //             else return val
                //         })
                //     })
                // }
                return layout
                }
            }
        }

        this.appletPresets = presetManifest

        document.getElementById("preset-selector").innerHTML += `
        <option value='default' disabled selected>Browse presets</option>
        `
        this.appletPresets.forEach((obj, i) => {
            if (i === 0) document.getElementById("preset-selector").innerHTML += `<option value=${obj.value}>${obj.name}</option>`
            else document.getElementById("preset-selector").innerHTML += `<option value=${obj.value}>${obj.name}</option>`
        })

        // Other
        this.applets = Array.from({ length: this.maxApplets }, (e, i) => { return { appletIdx: i + 1, name: null, classinstance: null } });

        this.session = bcisession;

        this.appletSelectIds = appletSelectIds;
        this.appletSelectIds.forEach((selectId,appletIdx) => {
            document.body.querySelector('.applet-select-container').innerHTML += `
            <div id='brainsatplay-selector-${selectId}' style="display: grid;  width: 100%; margin: 10px 25px 0px 25px; grid-template-columns: 1fr 1fr;">
                <span style="margin:auto 0; font-size: 80%">Applet ${appletIdx}</span>
                <select id="${selectId}" style="width: 100%;"></select>
            </div>`
        })
        
        this.initAddApplets(appletConfigs);

        window.addEventListener('resize', () => {
            this.responsive();
        })

        this.prevHovered = null;

        //this.responsive(); 

        // Set Styling Properly
        let applets = document.getElementById('applets');
        applets.style.display = 'grid'
        applets.style.height = '100%' // Must subtract any top navigation bar
        applets.style.width = '100%'
    }

    initUI = () => { }

    deinitUI = () => { }

    // Check class compatibility with current devices
    checkDeviceCompatibility = (appletManifest, devices = this.session.deviceStreams) => {
        let compatible = false
        if (this.session.deviceStreams.length === 0) compatible = true
        else {
            this.session.deviceStreams.forEach((device) => {
                if (Array.isArray(appletManifest.devices)) { // Check devices only
                    var regex = new RegExp( appletManifest.devices.join( "|" ), "i");
                    if (regex.test(device.info.deviceType) || regex.test(device.info.deviceName)) compatible = true
                }
                else if (typeof appletManifest.devices === 'object') { // Check devices AND specific channel tags
                    if (appletManifest.devices.includes(device.info.devices.deviceType) || appletManifest.devices.includes(device.info.deviceName)) {
                        if (appletManifest.devices.eegChannelTags) {
                            appletManifest.devices.eegChannelTags.forEach((tag, k) => {
                                let found = o.atlas.eegshared.eegChannelTags.find((t) => {
                                    if (t.tag === tag) {
                                        return true;
                                    }
                                });
                                if (found) compatible = true;
                            });
                        }
                    }
                }
            })
        }

        return compatible
    }

    //add the initial list of applets
    initAddApplets = async (appletConfigs = []) => {

        // Load Config
        let preset = undefined;
        let showOptions = true;


        if (appletConfigs.length === 0) {
            preset = this.appletPresets.find(preset => preset.value === document.getElementById("preset-selector").value);
            if (preset != null) this.appletConfigs = preset.applets;
            else this.appletConfigs = ['Applet Browser']
        } else {
            // disabled settings reloading for now
            if (appletConfigs.length === 1) {
                
                if (typeof appletConfigs[0] === 'string') {
                    if (appletConfigs[0].includes('_baas_client_app_id')){
                        handleAuthRedirect();
                        return
                    } 
                    preset = this.appletPresets.find((p) => {
                        if (p.value.toLowerCase() == appletConfigs[0].toLowerCase()) {
                            document.getElementById("preset-selector").value = p.value;
                            this.appletConfigs = p.applets
                            return true;
                        } else {
                            document.getElementById("preset-selector").value = 'default';
                            return false
                        }
                    });
                } 
                else {
                    this.appletConfigs = appletConfigs;
                }
            } else {
                this.appletConfigs = appletConfigs;
            }
        }
        if (preset) {
            if (preset.value.includes('HEG')) {
                if (this.session.atlas.settings.heg === false) {
                    this.session.atlas.addHEGCoord(0);
                    this.session.atlas.settings.heg = true;
                }
            } else if (preset.value.includes('EEG')) {
                if (this.session.atlas.settings.eeg === false) {
                    this.session.atlas.settings.eeg = true;
                }
            }

            if (preset.lock == true) {
                showOptions = false
            }
        }


        let appletPromises = []
        // Grab Correct Applets
        let currentApplets = this.applets.map(applet => applet.name)
        let isAllNull = (s, a) => s + ((a != null) ? 1 : 0)

        this.appletConfigs.forEach(conf => {
            if (typeof conf === 'object') {
                if (!currentApplets.reduce(isAllNull, 0) && appletManifest[conf.name] != null) {
                    appletPromises.push(new Promise(async (resolve, reject) => {
                        let settings = await getAppletSettings(appletManifest[conf.name])
                        let applet = await getApplet(settings)
                        return (applet != null) ? resolve([applet, settings]) : resolve([brainsatplay.App,settings])
                        // else return reject('applet does not exist')
                    }))
                }
            }
            else if (!currentApplets.reduce(isAllNull, 0) && appletManifest[conf] != null) {
                appletPromises.push(new Promise(async (resolve, reject) => {
                    let settings = await getAppletSettings(appletManifest[conf])
                    let applet = await getApplet(settings)
                    return (applet != null) ? resolve([applet, settings]) : resolve([brainsatplay.App,settings])
                }))
            }
        })

        // If no applets have been configured, redirect to base URL
        if (appletPromises.length == 0) {
            let getBrowser = async () => {
                let settings = await getAppletSettings(appletManifest['Applet Browser'])
                let applet = await getApplet(settings)
                return (applet != null) ? [applet, settings] : [brainsatplay.App,settings]
            }
            appletPromises = await getBrowser()
            window.history.replaceState({ additionalInformation: 'Updated Invalid URL' }, '', window.location.origin)
        }

        Promise.all(appletPromises).then(async (configApplets) => {

            // Check the compatibility of current applets with connected devices
            this.appletsSpawned = 0;

            let appletsCreated = []

            currentApplets.forEach((appname, i) => {
                let appletSettings = (appname != null) ? appletManifest[appname] : null
                let compatible = false;
                if (appletSettings != null) compatible = this.checkDeviceCompatibility(appletSettings) // Check if applet is compatible with current device(s)
                // else if (currentApplets.reduce((tot,cur) => tot + (cur == undefined)) != currentApplets.length-1) compatible = true // If all applets are not undefined, keep same layout

                // Replace incompatible applets
                if (!compatible) {
                    // Deinit old applet
                    if (this.applets[i].classinstance != null) {
                        this.deinitApplet(this.applets[i].appletIdx);
                    }

                    // Add new applet
                    let appletInfo = configApplets[0]
                    if (appletInfo) {
                        let appletCls = appletInfo[0]
                        let config = undefined;
                        if (typeof this.appletConfigs[i] === 'object') {
                            config = this.appletConfigs[i].settings;
                        }
                        let clsInstance = this.createInstance(appletCls, appletInfo[1], config)
                        appletsCreated.push(clsInstance)
                        configApplets.splice(0, 1)
                        this.appletsSpawned++;
                    }
                } else {
                    this.appletsSpawned++;
                }
            })

            Promise.all(appletsCreated).then((resolved) => {

                // Unfoled Created Applets
                resolved.forEach((instance, i) => {
                    this.applets[i] = {
                        appletIdx: i + 1,
                        name: this.appletConfigs[i],
                        classinstance: instance
                    }
                })

                // Initialize Applets
                this.initApplets();

                // Create Applet Selector
                if (showOptions) {
                    this.showOptions()
                } else {
                    document.body.querySelector('.applet-select-container').style.display = 'none'
                }
            })
        })
    }

    setAppletDefaultUI = (appnode) => {
        let manager = appnode.classinstance.AppletHTML ?? appnode.classinstance.ui?.manager

        if (manager){
        let appletDiv = manager.node
        let appletIdx = appnode.appletIdx - 1
        let defaultUI = document.getElementById(`${appletDiv.id}-brainsatplay-default-ui`)

        // Brains@Play Default Overlays
        if (defaultUI  == null ) // Check if default UI does not exists
        {

            appletDiv.style.gridArea = String.fromCharCode(97 + appletIdx);
            appletDiv.style.position = `relative`;
            
            // let thisApplet = this.applets[appletIdx].classinstance
            // let appletName = thisApplet.info.name
        }
    }
    }

    //initialize applets added to the list into each container by index
    initApplets = async (settings = []) => {

        // Assign applets to proper areas
        await Promise.all(this.applets.map(async (applet, i) => {
            if (applet.classinstance != null) {
                let manager = applet.classinstance.AppletHTML ?? applet.classinstance.ui?.manager
                if (manager === null || manager === undefined) { 
                    await applet.classinstance.init(); 
                }
                manager = applet.classinstance.AppletHTML ?? applet.classinstance.ui?.manager
                let appletDiv = (manager) ? manager.node : document.createElement('div');
                appletDiv.name = applet.name
            }
        }))

        this.enforceLayout();
        setTimeout(() => {
            this.responsive();
        }, 100)
    }


    createInstance = (appletCls, info={}, config=[]) => {

        return new Promise(async(resolve,reject) => {
            let parentNode = document.getElementById("applets")
            if (appletCls === brainsatplay.App){
                if (info.name === 'Applet Browser'){
                    config = {
                        hide: [],
                        applets: Object.keys(appletManifest).map((key) => appletManifest[key]),
                        presets: presetManifest
                    }

                    Promise.all(config.applets).then((resolved) => {
                        config.applets=resolved
                        resolve(new brainsatplay.App(info, parentNode, this.session, [config]))
                    })
                } else {
                    let app = await this.session.createApp(info, parentNode, this.session, config)
                    resolve(app)
                }
            } else {
                resolve(new appletCls(parentNode, this.session, config))
            }
        })
    }

    addApplet = async (appletCls, appletIdx, info={}) => {
        if (this.appletsSpawned < this.maxApplets) {
            var found = this.applets.find((o, i) => {
                if (o.appletIdx === appletIdx) {
                    this.deinitApplet(appletIdx);
                    return true;
                }
            });
            //let containerId = Math.floor(Math.random()*100000)+"applet";
            //let container = new DOMFragment(`<div id=${containerId}></div>`,"applets"); //make container, then delete when deiniting (this.applets[i].container.deleteFragment());

            //var pos = appletIdx-1; if(pos > this.applets.length) {pos = this.applets.length; this.applets.push({appletIdx: appletIdx, name: classObj.name, classinstance: new classObj.cls("applets",this.session), container: container});}
            //else { this.applets.splice(pos,0,{appletIdx: appletIdx, name: classObj.name, classinstance: new classObj.cls("applets",this.session), container: container});}
            
            let clsInstance = await this.createInstance(appletCls, info)
            
            var pos = appletIdx - 1; if (pos > this.applets.length) { pos = this.applets.length; this.applets[pos] = { appletIdx: pos + 1, name: classObj.name, classinstance: clsInstance }; }
            else { this.applets[pos] = { appletIdx: pos + 1, name: appletCls.name, classinstance: clsInstance }; }

            await this.applets[pos].classinstance.init();

            //let appletDiv =  this.applets[pos].classinstance.AppletHTML.node;
            // this.applets[pos].classinstance.AppletHTML.node.style.gridArea = String.fromCharCode(97 + pos)

            this.appletConfigs = [];
            this.applets.forEach((applet) => {
                if (applet.name !== null) {
                    this.appletConfigs.push(applet.name);
                }
            })
            this.appletsSpawned++;

            this.enforceLayout();
            this.responsive();
        }
    }

    deinitApplet = (appletIdx) => {
        var found = this.applets.find((o, i) => {
            if (o.appletIdx === appletIdx && o.classinstance != null) {
                if (this.applets[i].classinstance != null) {
                    this.applets[i].classinstance.deinit();
                }
                this.applets[i] = { appletIdx: i + 1, name: null, classinstance: null };
                this.appletsSpawned--;
                this.enforceLayout();
                this.responsive();
                return true;
            }
        });
    }

    deinitApplets() {
        this.applets.forEach((applet) => {
            this.deinitApplet(applet.appletIdx);
        })
    }

    reinitApplets = async () => {
        await Promise.all(this.applets.map(async (applet, i) => {
            applet.classinstance.deinit();
            await applet.classinstance.init();
        }))
        this.responsive();
    }

    updateOptionVisibility = () => {
        this.appletSelectIds.forEach((id, i) => {
            let div = document.getElementById(`brainsatplay-selector-${id}`)
                if (i < this.maxApplets) {
                    div.style.display = 'grid'
                } else {
                    div.style.display = 'none'
                }
            })
    }

    showOptions = () => {
        document.body.querySelector('.applet-select-container').style.display = 'flex'
        this.appletSelectIds.forEach((id, i) => {
            this.generateAppletOptions(id, i);
            this.updateOptionVisibility()
        })
    }

    generateAppletOptions = (selectId, appletIdx) => {
        
        const select = document.getElementById(selectId);
        select.innerHTML = "";
        let newhtml = `<option value='None'>None</option>`;
        let appletKeys = Object.keys(appletManifest)
        
        let arrayAppletIdx = this.applets.findIndex((o, i) => {
            if (o.appletIdx === appletIdx+1) {
                return true
            }
        })

        appletKeys.forEach((name) => {
            if (!['Applet Browser'].includes(name)) {
                if (this.checkDeviceCompatibility(appletManifest[name])) {
                    if (this.applets[arrayAppletIdx] && this.applets[arrayAppletIdx].name === name) {
                        newhtml += `<option value='` + name + `' selected="selected">` + name + `</option>`;
                    }
                    else {
                        newhtml += `<option value='` + name + `'>` + name + `</option>`;
                    }
                }
            }
        });
        select.innerHTML = newhtml;

        select.onchange = async (e) => {
            this.deinitApplet(appletIdx + 1);
            if (select.value !== 'None') {
                let appletSettings = await getAppletSettings(appletManifest[select.value])
                let appletCls = await getApplet(appletSettings) ?? brainsatplay.App
                this.addApplet(appletCls, appletIdx + 1, appletSettings);
            }
        }
    }

    enforceLayout(nodes = this.applets) {

        let layoutSelector = document.getElementById('layout-selector')
        let nodeLabels = {
            active: [],
            inactive: [],
            all: []
        }

        this.applets.forEach((app, i) => {
            if (app.classinstance != null) {
                nodeLabels.active.push(String.fromCharCode(97 + app.appletIdx - 1))
            } else {
                nodeLabels.inactive.push(String.fromCharCode(97 + app.appletIdx - 1))
            }
            nodeLabels.all.push(String.fromCharCode(97 + app.appletIdx - 1))
        })

        this.maxApplets = this.layoutTemplates[layoutSelector.value].maxApplets
        let responsiveLayout = this.layoutTemplates[layoutSelector.value].generate(nodeLabels)

        let layoutRows = responsiveLayout.length
        let layoutColumns = responsiveLayout[0].length
        let activeNodes = nodes.filter(n => n.classinstance != null)

        // Get Row Assignments
        let rowAssignmentArray = Array.from({ length: nodes.length }, e => new Set())
        responsiveLayout.forEach((row, j) => {
            row.forEach((col, k) => {
                if (col != null) rowAssignmentArray[col.charCodeAt(0) - 97].add(j)
            })
        })

        let innerStrings = responsiveLayout.map((stringArray) => {
            return '"' + stringArray.join(' ') + '"'
        }).join(' ')


        let applets = document.getElementById('applets');
        applets.style.gridTemplateAreas = innerStrings
        applets.style.gridTemplateColumns = `repeat(${layoutColumns},minmax(0, 1fr))`
        applets.style.gridTemplateRows = `repeat(${layoutRows},minmax(0, 1fr))`

        activeNodes.forEach((appnode, i) => {
            // Set Generic Applet Settings
            this.setAppletDefaultUI(appnode);
        });

        this.updateOptionVisibility()
    }

    responsive(nodes = this.applets) {
        let activeNodes = nodes.filter(n => n.classinstance != null)
        activeNodes.forEach((applet, i) => {
            applet.classinstance.responsive();
        });
    }
}
