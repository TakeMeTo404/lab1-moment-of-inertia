export const appSizeController = ({
  width, height, minFraction, maxFraction
}: Record<'width' | 'height' | 'minFraction' | 'maxFraction', number>) => {

  const calculateScale = () => {
    const widthProportion = window.innerWidth / width
    const heightProportion = window.innerHeight / height

    const windowProportion = window.innerWidth / window.innerHeight

    if (windowProportion >= minFraction && windowProportion <= maxFraction) {
        return Math.max(widthProportion, heightProportion)
    }

    return Math.min(widthProportion, heightProportion)
  }

  let scale = $state(calculateScale())

  $effect(() => {
    const listener = () => scale = calculateScale()

    window.addEventListener('resize', listener)

    return () => window.removeEventListener('resize', listener)
  })

  return {
    get scale() { return scale },
    width,
    height
  }
}
