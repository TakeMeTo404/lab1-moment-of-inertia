<script lang="ts">
    import { pipe } from 'lodash/fp'
    import { tweened } from 'svelte/motion'
    import { derived, readable, writable } from 'svelte/store'
    import type { Readable, Writable } from 'svelte/store'
    import { variantToI, ranges, sceneHeightPx } from './const'
    import { height, scale, width } from '../lib/sizes'
    import '../lib/ui-kit.scss'

    const formFields = ['variant', 'M', 'm1', 'm2', 'R', 'S1', 'S2', 'overloadIndex'] as const

    /*type Form = {
        [K in typeof formFields[number]]: {
            value: number,
            error: string,
        }
    }*/



    let formValues: {
        [K in 'variant']: Writable<number>
        // [K in typeof formFields[number]]: Writable<number>
    } = {
        variant: writable()
    }

    $: console.log(formValues.variant)

    setTimeout(() => {
        formValues.variant.set(1)
    }, 1000)

    setTimeout(() => {
        formValues.variant.set(2)
    }, 2000)


    /*let form = {
        value: writable<number>(),
        error: derived()
    }*/

    // let form: Form = {
    //
    // }


    /*let form = {
        variant: {
            value: null as any as number,
            error:
        }
    } as const*/


/*    let form = {
        variant: null
    }

    $: console.log(form.variant)

    setTimeout(() => {
        form.variant = 1 as any as null
    }, 1000)

    setTimeout(() => {
        form.variant = 2 as any as null
    }, 2000)

    setTimeout(() => {
        form = { variant: 5 as any as null }
    }, 5000)*/

    /*let variantNumber: number
    let I: number
    $: I = variantToI[variantNumber ?? 1] ?? variantToI[1]*/

    let variantNumber: number | null
    let I: number
    $: I = variantToI[variantNumber ?? 1] ?? variantToI[1]

    let M: number = null as any as number
    let m1: number = null as any as number
    let m2: number = null as any as number

    let R: number = null as any as number
    let S1: number = null as any as number
    let S2: number = null as any as number

    let overloadIndex: 1 | 2 = null as any

    let appState: 'idle' | 'moving-to-start' | 'falling-phase-1' | 'falling-phase-2' | 'fall-done' = 'idle'
    let error: string = ''

    let canInput: boolean = false, canClickStart: boolean = false, canClickRaise: boolean = false
    $: canInput = (appState === 'idle' || appState === 'moving-to-start')
    $: canClickStart = (appState === 'idle' || appState === 'moving-to-start')
    $: canClickRaise = appState === 'fall-done'

    const sceneState = {
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
    }

    const onClickStart = async () => {


        appState = 'fall-done'
    }

    const x = tweened(0)

    x.subscribe(v => sceneState.pulley.rotation = v)

    x.set(30, { duration: 30000 })


</script>

<div class="app" style="width: {width}px; height: {height}px; scale: {$scale};">
    <div class="scene-center">
        <div class="scene" style="height: {sceneHeightPx}px; width: {sceneState.pulley.sizePx}px;">
            <div class="pulley"
                 style="height: {sceneState.pulley.sizePx}px; width: {sceneState.pulley.sizePx}px; rotate: {sceneState.pulley.rotation * 360}deg;"></div>

            <div class="thread"
                 style="left: 0; height: {sceneHeightPx - sceneState.load.leftBottomPx - sceneState.load.sizePx}px;"></div>
            <div class="load left-load"
                 style="height: {sceneState.load.sizePx}px; width: {sceneState.load.sizePx}px; bottom: {sceneState.load.leftBottomPx}px;"></div>

            <div class="thread"
                 style="right: 0; height: {sceneHeightPx - sceneState.load.rightBottomPx - sceneState.load.sizePx}px;"></div>
            <div class="load right-load"
                 style="height: {sceneState.load.sizePx}px; width: {sceneState.load.sizePx}px; bottom: {sceneState.load.rightBottomPx}px;"></div>

            <div class="magnet" style="bottom: {sceneState.magnet.bottomPx}px;"></div>
        </div>
    </div>

    <div class="ui-holder">
        <div class="ui">
            <h1>Лабораторная работа №10</h1>

            <section style="padding-top: 2rem;">
                <div class="section-element">
                    <div class="flex">
                        <span>Номер варианта</span>
<!--                        <input class="text-field" placeholder="От 1 до 30" bind:value={form.variant}/>-->
                        <input class="text-field" placeholder="От 1 до 30" bind:value={formValues.variant}/>
                    </div>
                </div>
            </section>

            <section style="padding-top: 1.5rem;">
                <div class="section-element">
                    <div class="flex">
                        <span>M – масса груза (г.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.M.min} до {ranges.physical.M.max}"/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>m1 – масса 1 перегрузка (г.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.m.min} до {ranges.physical.m.max}"/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>m1 – масса 2 перегрузка (г.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.m.min} до {ranges.physical.m.max}"/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>R – радиус шкива (см.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.R.min * 100} до {ranges.physical.R.max * 100}"/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>S1 – расстояние 1 (см.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.S1.min * 100} до {ranges.physical.S1.max * 100}"/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>S2 – расстояние 2 (см.)</span>
                        <input class="text-field" placeholder="От {ranges.physical.S2.min  * 100} до {ranges.physical.S2.max * 100}"/>
                    </div>
                </div>
                <div class="section-element">
                    <input name="index" type="radio" class="toggle" checked/>
                    <input name="index" type="radio" class="toggle"/>
                </div>
                <div class="section-element">
                    <button>Отпустить груз</button>
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