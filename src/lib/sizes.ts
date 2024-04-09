import { readable } from 'svelte/store'

export const width = 1600
export const height = 900

// const minFraction = 1000 / height
// const maxFraction = width / 780

const minFraction = width / height
const maxFraction = width / height

const calculateScale = () => {
    const widthProportion = window.innerWidth / width
    const heightProportion = window.innerHeight / height

    const windowProportion = window.innerWidth / window.innerHeight

    if (windowProportion >= minFraction && windowProportion <= maxFraction) {
        return Math.max(widthProportion, heightProportion)
    }

    return Math.min(widthProportion, heightProportion)
}

export const scale = readable(calculateScale(), (set) => {
    const listener = () => set(calculateScale())

    window.addEventListener('resize', listener)

    return () => window.removeEventListener('resize', listener)
})