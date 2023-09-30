import placeholderImage from '../../../frontend/assets/features/placeholder.png'

export const createCards = (appletSettings=[], filter = (settings) => { return settings }, onclick=()=>{}) => {
        
        let appletCards = []
        appletSettings = appletSettings.filter(filter)

        appletSettings.sort(function (first, second) {
            let translate = (settings) => {
                if (settings.devices.length === 0) {
                    return 0 // none
                } else if (settings.devices[0] == 'eeg') {
                    return 1 // eeg
                } else if (settings.devices[0] == 'heg') {
                    return 2 // heg
                } else if (settings.devices.length > 1) {
                    return 3 // all
                } else {
                    return 4 // other
                } 
            }
            let pos1 = translate(first)
            let pos2 = translate(second)
            return pos1 - pos2;
        });

        let platformLocation = (location.origin.includes('app.brainsatplay.com') ? 'production' : 'development')

        appletSettings.forEach(settings => {

            if ((settings.display != null && (settings.display.development === false || settings.display[platformLocation] === false))) { }
            else {
                let type;
                if (settings.devices.length === 0) {
                    type = 'None'
                    settings.devices = type
                } else if (settings.devices.length > 1) {
                    type = 'All'
                } else {
                    type = settings.devices[0]
                }

                let categoryString = settings.categories.map(category => category[0].toUpperCase() + category.slice(1)).join(', ')

                let author = settings.author
                // if (['Garrett Flynn', 'Joshua Brewster', 'Samir Ghosh'].includes(author)) author = 'Brains@Play'

                let img = settings.image ?? placeholderImage

                let browserCard = document.createElement('div')
                // browserCard.id = `${this.props.id}-${settings.name}`
                browserCard.classList.add(`browser-card`)
                browserCard.classList.add(`applet`)
                browserCard.setAttribute(`categories`, settings.categories)
                browserCard.setAttribute(`devices`, settings.devices)

                browserCard.innerHTML = `
                    <img src="${img}">
                    <div class='info'>
                        <h2 style="margin-bottom: 5px;">${settings.name}</h2>
                        <p style="font-size: 80%; margin: 0px;">By ${author}</p>
                        <p style="font-size: 80%; margin: 15px 0px 20px 0px">${settings.description}</p>
                        <span style="position: absolute; bottom: 10px; right: 10px; font-size: 60%;margin-top: 5px;">Tags: ${categoryString}, ${type}</span>
                    </div>
                `

                browserCard.onclick = () => {
                    onclick(browserCard, settings)
                }

                appletCards.push({settings: settings, element: browserCard})
            }
    })

    return appletCards
}