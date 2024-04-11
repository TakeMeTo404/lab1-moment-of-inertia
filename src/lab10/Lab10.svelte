<script lang="ts">
    import { every, pipe, values } from 'lodash/fp'
    import { tweened } from 'svelte/motion'
    import { readable, writable } from 'svelte/store'
    import type { Readable, Writable } from 'svelte/store'
    import { variantToI, ranges, sceneHeightPx, variantRange } from './const'
    import { height, scale, width } from '../lib/sizes'
    import type { Range } from '../lib/range-util'
    import { range, inRange, mid } from '../lib/range-util'
    import { untrack } from 'svelte';
    import '../lib/ui-kit.scss'
    import Input from '../lib/Input.svelte';

    type AppState = 'idle' | 'falling-phase-1' | 'falling-phase-2' | 'fall-done'
    let appState = $state<AppState>('idle')

    type Validator = (v: number | undefined) => string | undefined

    type InputConfig = { title: string, range: Range, tweenMs?: number }

    const input = ({
        title,
        range,
        tweenMs
    }: InputConfig) => {

        let input = $state<number>()
        let error = $derived.by(() => {
            if (input === undefined || input === null || input === '') {
                return 'Введите значение'
            }
            if (typeof input !== 'number') {
                return 'Некорректное значение'
            }
            if (!inRange(range)(input)) {
                return 'Значение вне диапазона'
            }
            return undefined
        })
        let valid = $derived(!error)
        let showError = $state<boolean>()

        let value = $state<number>(mid(range))
        let tweening = $state<boolean>(false)

        $effect(() => {
            input;
            showError = false
        })

        $effect(() => {
            if (appState === 'idle') {
                $effect(() => {
                    if (!valid || typeof input !== 'number') {
                        return
                    }

                    const newValue = input;
                    const oldValue = untrack(() => value)

                    if (!tweenMs) {
                        value = newValue
                        return
                    }

                    const fr = Math.abs(newValue - oldValue) / (range.max - range.min)

                    let actual = true

                    const tween = tweened(oldValue)

                    tweening = true
                    tween.set(newValue, { duration: tweenMs * fr })
                        .then(() => {
                            if (actual) {
                                tweening = false
                            }
                        })

                    const unsubscribe = tween.subscribe(v => value = v)
                    
                    return () => {
                        actual = false
                        unsubscribe()
                    }
                })
            }
        })

        return {
            get input() { return input },
            set input(v) { console.log('setter'); input = v },

            get error() { return error },
            get valid() { return valid },
            get showError() { return showError },
            revealErrorIfIvalid() { if (!valid) showError = false },

            get value() { return value },
            get tweening() { return tweening },

            title,
            placeholder: `От ${range.min} до ${range.max}`
        }
    }

    const variant = input({ title: 'Номер варианта', range: variantRange })
    const M = input({ title: 'M – масса грузов', range: ranges.physical.M, tweenMs: 1000 })
    const m1 = input({ title: 'm1 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000 })
    const m2 = input({ title: 'm2 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000 })
    const R = input({ title: 'R – радиус шкива (см.)', range: ranges.physical.R, tweenMs: 1000 })
    const S1 = input({ title: 'S1 – расстояние (см.)', range: ranges.physical.S1, tweenMs: 1000 })
    const S2 = input({ title: 'S2 – расстояние (см.)', range: ranges.physical.S2, tweenMs: 1000 })
    const overloadI = input({ title: '', range: { min: 1, max: 2 } })

    const allInputs = [variant, M, m1, m2, R, S1, S2, overloadI]

    const allInputsValid = $derived(allInputs.every(input => input.valid))
    const tweening = $derived(allInputs.some(input => input.tweening))

    // const numberInput = (
    //     title: string,
    //     placeholder: string,
    //     validator: Validator
    // ) => {
    //     let value = $state<number>()
    //     const error = $derived(validator(value))

    //     let displayedError = $state<string>()

    //     $effect(() => {
    //         if (appState === 'idle' || appState === 'tweening') {
    //             $effect(() => {
    //                 value;
    //                 displayedError = undefined
    //             })
    //         }
    //     })

    //     return {
    //         title,
    //         placeholder,
    //         get value() {
    //             return value
    //         },
    //         set value(v: number | undefined) {
    //             value = v
    //         },
    //         get error() {
    //             return error
    //         },
    //         get displayedError() {
    //             return displayedError
    //         },
    //         validate() {
    //             displayedError = error
    //         }
    //     }
    // }
    // const rangeValidator = (range: Range): Validator => {
    //     return (v) => {
    //         if (v === undefined || v === null || v === '') {
    //             return 'Введите значение'
    //         }
    //         if (typeof v !== 'number') {
    //             return 'Некорректное значение'
    //         }
    //         if (!inRange(range)(v)) {
    //             return 'Значение вне диапазона'
    //         }
    //         return undefined
    //     }
    // }
    // const placeholder = (range: Range) => `От ${range.min} до ${range.max}`
    // const smoothParameterInput = (
    //     title: string,
    //     range: Range
    // ) => {

    //     const input = numberInput(
    //         title,
    //         placeholder(range),
    //         rangeValidator(range)
    //     )

    //     let value = $state((range.min + range.max) / 2)
        
    //     let tweening = $state<boolean>()

    //     const tweenedValue = tweened<number>((range.min + range.max) / 2)

    //     tweenedValue.subscribe((v) => {
    //         if (appState === 'idle') {
    //             value = v
    //         }
    //     })

    //     $effect(() => {
    //         if (appState === 'idle' || appState === 'tweening') {
    //             if (!input.error && typeof input.value === 'number') {
    //                 const timeFraction = Math.abs(untrack(() => value) - input.value) / (range.max - range.min)

    //                 tweening = true
    //                 tweenedValue.set(input.value, { duration: timeFraction * 2000 })
    //                     .then(() => tweening = false)
    //             }
    //         }
    //     })


    //     return {
    //         input,
    //         get value() {
    //             return value
    //         },
    //         get tweening() {
    //             return tweening
    //         }
    //     }
    // }

    // const variantNumber = numberInput(
    //     'Номер варианта',
    //     placeholder(variantRange),
    //     rangeValidator(variantRange)
    // )
 
    // const parameters = {
    //     M: smoothParameterInput('М – масса груза (г.)', ranges.physical.M),
    //     m1: smoothParameterInput('m1 – масса 1 перегрузка (г.)', ranges.physical.m),
    //     m2: smoothParameterInput('m2 – масса 2 перегрузка (г.)', ranges.physical.m),
    //     R: smoothParameterInput('R – радиус шкива (см.)', ranges.physical.R),
    //     S1: smoothParameterInput('S1 – расстояние 1 (см.)', ranges.physical.S1),
    //     S2: smoothParameterInput('S2 – расстояние 2 (см.)', ranges.physical.S2),
    // } as const

    // const overloadIndex = smoothParameterInput('', range(1, 2))

    // const allInputsValid = $derived(!variantNumber.error && Object.values(parameters).every(p => !p.input.error) && !overloadIndex.input.error)
    // const tweening = $derived(Object.values(parameters).some(p => p.tweening) || overloadIndex.tweening)

    $effect(() => console.log('allInputsValid = ', allInputsValid))
    $effect(() => console.log('tweening = ', tweening))

    const onClickStart = () => {
        if (!allInputsValid) {
            allInputs.forEach(input => input.revealErrorIfIvalid())
            return
        }

        if (tweening) {
            console.warn('cannot start while tweening');
            return
        }

        (async function fall() {
            appState = 'falling-phase-1'

            appState = 'fall-done'
        })()
    }

    // const onClickStart = () => {
    //     if (!allInputsValid) {
    //         variantNumber.validate()
    //         Object.values(parameters).forEach((p) => p.input.validate())
    //         overloadIndex.input.validate()
    //         return
    //     }

    //     if (tweening) {
    //         console.warn('cannot start while tweening');
    //         return
    //     }

    //     fall()
    // }

    const onClickRepeat = () => {
        console.log('repeat');
    }

    // const fall = async () => {

    // }

    const pulley = $state({ sizePx: 0, rotation: 0 })
    // $effect(() => {
    //     if (appState === 'idle') {
    //         const fr = (parameters.R.value - ranges.physical.R.min) / (ranges.physical.R.max - ranges.physical.R.min)
    //         pulley.sizePx = ranges.px.pulleyRadius.min + (ranges.px.pulleyRadius.max - ranges.px.pulleyRadius.min) * fr
    //     }
    // })

    const loads = $state({ sizePx: 0, leftBottomPx: 0, rightBottomPx: 0 })
    // $effect(() => {
    //     if (appState === 'idle') {
    //         const fr = (parameters.M.value - ranges.physical.M.min) / (ranges.physical.M.max - ranges.physical.M.min)
    //         loads.sizePx = ranges.px.loadSize.min + (ranges.px.loadSize.max - ranges.px.loadSize.min) * fr
    //     }
    // })

    const leftThreadLengthPx = $derived(sceneHeightPx - loads.leftBottomPx - loads.sizePx)
    const rightThreadLengthPx = $derived(sceneHeightPx - loads.rightBottomPx - loads.sizePx)

    const overload = $state({ sizePx: 0, bottomPx: 0 })
    // $effect(() => {
    //     if (appState === 'idle') {
    //         const fr = (parameters.M.value - ranges.physical.M.min) / (ranges.physical.M.max - ranges.physical.M.min)
    //         loads.sizePx = ranges.px.loadSize.min + (ranges.px.loadSize.max - ranges.px.loadSize.min) * fr
    //     }
    // })

    type SceneState = {
        pulley: {
            sizePx: number,
            rotation: number
        },
        load: {
            sizePx: number,
            leftBottomPx: number,
            rightBottomPx: number
        },
        overload: {
            sizePx: number,
            bottomPx: number
        },
        magnet: {
            bottomPx: number
        }
    }

    const sceneState = $state<SceneState>({
        pulley: {
            sizePx: ranges.px.pulleyRadius.max * 2,
            rotation: 0
        },
        load: {
            sizePx: ranges.px.loadSize.max,
            leftBottomPx: 0,
            rightBottomPx: 300
        },
        overload: {
            sizePx: ranges.px.pulleyRadius.min * 2,
            bottomPx: 0
        },
        magnet: {
            bottomPx: 200
        }
    })

</script>

<div class="app" style="width: {width}px; height: {height}px; scale: {$scale};">
    <div class="scene-center">
        <div class="scene" style="height: {sceneHeightPx}px; width: {pulley.sizePx}px;">
            <div class="pulley"
                 style="height: {pulley.sizePx}px; width: {pulley.sizePx}px; rotate: {pulley.rotation * 360}deg;"></div>

            <div class="thread"
                 style="left: 0; height: {leftThreadLengthPx}px;"></div>
            <div class="load left-load"
                 style="height: {loads.sizePx}px; width: {loads.sizePx}px; bottom: {loads.leftBottomPx}px;"></div>

            <div class="thread"
                 style="right: 0; height: {rightThreadLengthPx}px;"></div>
            <div class="load right-load"
                 style="height: {loads.sizePx}px; width: {loads.sizePx}px; bottom: {loads.rightBottomPx}px;"></div>

            <div class="magnet" style="bottom: {sceneState.magnet.bottomPx}px;"></div>
        </div>
    </div>

    <div class="ui-holder">
        <div class="ui">
            <h1>Лабораторная работа №10</h1>

            {#snippet numberInput(input)}
                <div class="section-element">
                    <div class="flex">
                        <span>{input.title}</span>
                        <input
                            bind:value={input.input}
                            placeholder={input.placeholder}
                            type="number"
                            class="text-field"
                        />  
                        {#if !input.valid && input.showError}
                            <span class="error red">{ input.error }</span>
                        {/if}
                    </div>
                </div>
            {/snippet}

            <section style="padding-top: 2rem;">
                {@render numberInput(variant)}

                <!-- <div class="section-element">
                    <div class="flex">
                        {@render numberInput(variant)} -->
                        <!-- <Input bind:value={variant}>
                            {#snippet input(v)}
                                <span>{'Some title'}</span>
                                <input
                                bind:value={v.value}
                                placeholder={'Placeholder'}
                                type="number"
                                class="text-field" 
                                />            
                            {/snippet}
                        </Input> -->
                        <!-- <span>{variantNumber.title}</span>
                        <input
                        bind:value={variantNumber.value}
                        placeholder={variantNumber.placeholder}
                        type="number"
                        class="text-field" 
                        />
                        {#if variantNumber.displayedError}
                            <span class="error red">{ variantNumber.displayedError }</span>
                        {/if} -->
                    <!-- </div>
                </div> -->
            </section>

            <section style="padding-top: 1.5rem;">
                {#each [M, m1, m2, R, S1, S2] as input}
                    {@render numberInput(input)}
                    <div class="divider"></div>
                {/each}

                <!-- {#each Object.values(parameters) as p }
                    <div class="section-element">
                        <div class="flex">
                            <span class:red={p.input.displayedError}>{p.input.title}</span>
                            <input
                            bind:value={p.input.value}
                            placeholder={p.input.placeholder}
                            type="number"
                            class="text-field"
                            />  
                            {#if p.input.displayedError}
                            <span class="error red">{ p.input.displayedError }</span>
                            {/if}
                        </div>
                    </div>
                    <div class="divider"></div>
                {/each} -->

                <div class="section-element">
                    <!-- <Input bind:value={index}>
                        {#snippet input(v)}
                            <span>{'Some title'}</span>
                            <input type="radio" value={1} bind:group={v.value}>
                            <input type="radio" value={2} bind:group={v.value}>        
                        {/snippet}
                    </Input> -->
                    <!-- <input type="radio" value={1} bind:group={overloadIndex.input.value}>
                    <input type="radio" value={2} bind:group={overloadIndex.input.value}> -->
                </div>

                <div class="section-element">
                    <button onclick={onClickStart}>Отпустить груз</button>
                </div>
            </section>

            <section style="padding-top: 1.5rem; padding-bottom: 1.5rem;">
                <div class="section-element"></div>
                <div class="divider"></div>
                <div class="section-element"></div>
            </section>
        </div>
    </div>
</div>

<style lang="scss">
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    @mixin centered {
        left: 50%;
        top: 50%;
        translate: -50% -50%;
    }

    .app {
        position: fixed;
        top: 50%;
        left: 50%;
        translate: -50% -50%;
        border: 1px solid black;
        background-size: contain;
        background-image: url("./assets/bg.jpg");
        background-repeat: no-repeat;
    }

    .scene-center {
        position: absolute;
        border: 2px solid red;

        width: 1px;
        height: 1px;

        top: 400px;
        right: 450px;
    }

    .scene {
        position: absolute;
        border: 2px solid blue;

        @include centered;
    }

    .pulley {
        z-index: 2;
        background-image: url("./assets/pulley.png");
        position: absolute;

        background-size: contain;
        background-position: center center;
        background-repeat: no-repeat;

        left: 0;
        top: 0;
        translate: 0 -50%;
    }

    .load {
        position: absolute;

        background-size: contain;
        background-position: center center;
        background-repeat: no-repeat;

        background-color: red;

        &.left-load {
            //background-image: url("./assets/load1.png");
            left: 0;
            translate: -50% 0;
        }

        &.right-load {
            //background-image: url("./assets/load2.png");
            right: 0;
            translate: 50% 0;
        }
    }

    .thread {
        //width: 1px;
        //background: black;
        position: absolute;
        top: 0;

        width: 4px;
        background: yellow;
    }

    .magnet {
        position: absolute;
        width: 50px;
        height: 5px;
        background-color: chocolate;
        right: 0;
        translate: 100% 0;
    }

</style>