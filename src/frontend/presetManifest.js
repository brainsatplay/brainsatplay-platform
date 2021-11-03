

import placeholderImg from './assets/features/placeholder.png'
import eegNFImage from '../apps/General/blob/img/feature.png'
import HEGImage from './assets/features/hegbiofeedback.png'
import hegsens from '../apps/General/sensorium/feature.png'
import studio from '../apps/Templates/blank/feature.png'
import OBB from '../apps/UI/onebitbonanza/feature.jpg'
import breathgarden from '../apps/WIPs/breathgarden/feature.png'

export let presetManifest = [
    {
        value: 'EEG',
        name: "EEG Neurofeedback",
        applets: [
            'Blob',
            'Brain Map',
            'Spectrogram',
            'uPlot',
        ],
        description: "Bandpower training, coherence, and more.",
        type: "EEG",
        image: eegNFImage,
        lock: false
    },
    {
        value: 'BreathGarden',
        name: "Breath Garden",
        applets: [
            'Breath Garden',
        ],
        description: "WebXR breathing meditation | 2021 XR Brain Jam",
        type: "All",
        image: breathgarden,
        lock: false
    },
    {
        value: 'HEGSensorium',
        name: "HEG Sensorium",
        applets: [
            'Sensorium',
            'Pulse Monitor'
        ],
        description: "Immersive audio-visual feedback with HEG graphing.",
        type: "HEG",
        image: hegsens,
        lock: false
    },
    {
        value: 'onebitbonanza',
        name: "One Bit Bonanza",
        applets: [
            'One Bit Bonanza',
        ],
        description: "Experience a random low-bandwidth game every 10 seconds!",
        type: "EEG",
        image: OBB,
        lock: true	
    },
    {
        value: 'Studio',
        name: "Brains@Play Studio",
        applets: [
            'Blank Project',
        ],
        description: "Create your own application with Brains@Play.",
        type: "All",
        image: studio,
        lock: false
    },
    {
        value: 'HEG',
        name: "HEG Biofeedback",
        applets: [
            'Circle',
            'Audio',
            'Pulse Monitor',
        ],
        description: "Brain blood flow training!",
        type: "HEG",
        image: HEGImage,
        lock: false
    },
]
