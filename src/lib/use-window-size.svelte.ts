export const useWindowSize = () => {
    let innerWidth = $state(window.innerWidth)
    let innerHeight = $state(window.innerHeight)

    $effect(() => {
        const listener = () => {
            innerWidth = window.innerWidth
            innerHeight = window.innerHeight
        }

        window.addEventListener("resize", listener);

        return () => window.removeEventListener("resize", listener);
    })

    return {
        get innerWidth() {
            return innerWidth
        },
        get innerHeight() {
            return innerHeight
        }
    }
}
