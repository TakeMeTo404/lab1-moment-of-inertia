import { useWindowSize } from './use-window-size.svelte'

export const sceneScale = ({
    width: sceneWidth,
    height: sceneHeight,
    minFraction,
    maxFraction,
}: Record<"width" | "height" | "minFraction" | "maxFraction", number>) => {

    const windowSize = useWindowSize()
    const normalizedWindowSize = $derived.by<ReturnType<typeof useWindowSize>>(() => {
        const windowFraction = windowSize.innerWidth / windowSize.innerHeight

        if (windowFraction < minFraction) {
            return {
                innerWidth: windowSize.innerWidth,
                innerHeight: windowSize.innerWidth / minFraction,
            }
        } else if (windowFraction > maxFraction) {
            return {
                innerHeight: windowSize.innerHeight,
                innerWidth: windowSize.innerHeight * maxFraction
            }
        }

        return {
            ...windowSize
        }
    })

    const scale = $derived(Math.max(
        normalizedWindowSize.innerWidth / sceneWidth,
        normalizedWindowSize.innerHeight / sceneHeight
    ))


    return {
        get value() {
            return scale
        }
    };
};
