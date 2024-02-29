import { readable } from 'svelte/store'

const calculateScale = () => {
    return Math.min(
        window.innerWidth / width,
        window.innerHeight / height
    )
}

export const width = 1600
export const height = 900
export const scale = readable(calculateScale(), (set) => {
    const listener = () => set(calculateScale())

    window.addEventListener('resize', listener)

    return () => window.removeEventListener('resize', listener)
})