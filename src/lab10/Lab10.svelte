<script lang="ts">
    import { pipe } from 'lodash/fp'
    import { random } from 'lodash'
    import { tweened } from 'svelte/motion'
    import { variantToI, ranges, sceneHeightPx, variantRange, pxPerMeter } from './const'
    // import { height, scale, width } from '../lib/sizes'
    import type { Range } from '../lib/range-util'
    import { inRange, mid, calcFr, lerp } from '../lib/range-util'
    import { untrack } from 'svelte';
    import '../lib/ui-kit.scss'
    import { appSizeController } from '../lib/app-sizes-controller.svelte';

    let appState = $state<'idle' | 'falling-phase-1' | 'falling-phase-2' | 'fall-done' | 'raising-phase-1' | 'raising-phase-2'>('idle')

    type InputConfig = { title: string, range: Range, tweenMs?: number, initialValue?: number }
    const input = ({
        title,
        range,
        tweenMs,
        initialValue
    }: InputConfig) => {

        let input = $state<number>(initialValue)
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

        let value = $state<number>(initialValue ?? mid(range))
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

                    if (newValue === oldValue) {
                      return
                    }

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
            set input(v) { input = v },

            get error() { return error },
            get valid() { return valid },
            get showError() { return showError },
            revealErrorIfIтvalid() { if (!valid) showError = false },

            get value() { return value },
            get tweening() { return tweening },

            title,
            placeholder: `От ${range.min} до ${range.max}`
        }
    }

    const variant = input({ title: 'Номер варианта', range: variantRange })
    const M = input({ title: 'M – масса грузов (г.)', range: ranges.physical.M, tweenMs: 1000 })
    const m1 = input({ title: 'm1 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000 })
    const m2 = input({ title: 'm2 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000 })
    const R = input({ title: 'R – радиус шкива (см.)', range: ranges.physical.R, tweenMs: 1000 })
    const S1 = input({ title: 'S1 – расстояние (см.)', range: ranges.physical.S1, tweenMs: 1000 })
    const S2 = input({ title: 'S2 – расстояние (см.)', range: ranges.physical.S2, tweenMs: 1000 })
    const overloadI = input({ title: '', range: { min: 1, max: 2 }, tweenMs: 500 })
    // const variant = input({ title: 'Номер варианта', range: variantRange, initialValue: random(1, 30) })
    // const M = input({ title: 'M – масса грузов (г.)', range: ranges.physical.M, tweenMs: 1000, initialValue: random(50, 100) })
    // const m1 = input({ title: 'm1 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000, initialValue: random(5, 20) })
    // const m2 = input({ title: 'm2 – масса 1 перегрузка (г.)', range: ranges.physical.m, tweenMs: 1000, initialValue: random(5, 20) })
    // const R = input({ title: 'R – радиус шкива (см.)', range: ranges.physical.R, tweenMs: 1000, initialValue: random(6, 10) })
    // const S1 = input({ title: 'S1 – расстояние (см.)', range: ranges.physical.S1, tweenMs: 1000, initialValue: random(10, 20) })
    // const S2 = input({ title: 'S2 – расстояние (см.)', range: ranges.physical.S2, tweenMs: 1000, initialValue: random(10, 20) })
    // const overloadI = input({ title: '', range: { min: 1, max: 2 }, tweenMs: 500, initialValue: random(1, 2) })

    const allInputs = [variant, M, m1, m2, R, S1, S2, overloadI]

    const allInputsValid = $derived(allInputs.every(input => input.valid))
    const tweening = $derived(allInputs.some(input => input.tweening))

    const g = 9.81
    const I = $derived(variantToI[Math.round(variant.value)])
    $inspect(I)

    $effect(() => console.log('allInputsValid = ', allInputsValid))
    $effect(() => console.log('tweening = ', tweening))

    let rnd = $state(Math.random())
    $effect(() => {
      m1.input; m2.input;
      rnd = Math.random()
    })

    const onClickStart = () => {
        if (appState !== 'idle') {
          return
        }

        if (!allInputsValid) {
            allInputs.forEach(input => input.revealErrorIfIтvalid())
            return
        }

        if (tweening) {
            console.warn('cannot start while tweening');
            return
        }

        // if (m1.value === m2.value) {
        //   alert('m1 не может быть равно m2')
        //   return
        // }

        (async function fall() {

            const _m1 = m1.value
            const _m2 = m2.value

            const a = (function calculateA() {
                const [a1, a2] = (function () {
                    if (m2.value <= m1.value) {
                      let minA1 =
                        (R.value ** 2) * (_m1 - _m2) * g
                        /
                        (I + (R.value**2) * (2 * M.value + _m1))
                      minA1 += .1
                      const maxA1 = minA1 + .5

                      // const rnd = Math.random()
                      const a1 = minA1 + (maxA1 - minA1) * rnd
                      console.log(`rnd = ${rnd}`)
                      const a2 = (a1 * (I + (R.value**2) * (2 * M.value + _m1)) - (R.value ** 2) * (_m1 - _m2) * g) /
                        (I + (R.value**2) * (2 * M.value + _m2))

                      return [a1, a2]
                    }
                    else {

                      let minA2 = ((0) * (I + (R.value**2) * (2 * M.value + _m1)) - (R.value ** 2) * (_m1 - _m2) * g) /
                        (I + (R.value**2) * (2 * M.value + _m2))
                      minA2 += .1
                      const maxA2 = minA2 + .5

                      // const rnd = Math.random()
                      const a2 = minA2 + (maxA2 - minA2) * rnd
                      console.log(`inverse rnd = ${rnd}`)

                      const a1 =
                        (a2 * (I + R.value**2 * (2 * M.value + _m2)) + R.value**2 * (_m1 - _m2) * g)
                        /
                        (I + R.value**2 * (2*M.value + _m1))

                      return [a1, a2]
                    }
                })()

                // const _m1 = Math.max(m1.value, m2.value)
                // const _m2 = Math.min(m1.value, m2.value)
                // const _m1 = m1.value
                // const _m2 = m2.value

                // if (inverse) {
                //   alert('not implemeted yet')
                // }



                // const a2Func = (a1: number) => (a1 * (I + (R.value**2) * (2 * M.value + _m1)) - (R.value ** 2) * (_m1 - _m2) * g) /
                //   (I + (R.value**2) * (2 * M.value + _m2))

                // let minA1 =
                //   (R.value ** 2) * (_m1 - _m2) * g
                //   /
                //   (I + (R.value**2) * (2 * M.value + _m1))
                // minA1 += .1
                // const maxA1 = minA1 + .5

                // const rnd = Math.random()
                // const a1 = minA1 + (maxA1 - minA1) * rnd
                // console.log(`rnd = ${rnd}`)
                // const a2 = a2Func(a1)

                console.log(`a1 = ${a1.toFixed(3)}\ta2 = ${a2.toFixed(3)}`)

                const studentI = R.value**2 / (a1 - a2) * ((_m1 - _m2) * g - a1 * (2 * M.value + _m1)+ a2 * (2 * M.value + _m2))
                console.log(`I = ${I.toFixed(6)}\tstudentI = ${studentI.toFixed(6)}\tdiff = ${Math.abs(I - studentI).toFixed(6)}`)

                return overloadI.value === 1 ? a1: a2

                // const min_a1 = (R.value ** 2) * (_m1 - _m2) * g / (I + (R.value ** 2) * (2 * M.value + _m1))
            })()

            console.log(`a = ${a}`)

            // m/s^2
            // const a = 1/10
            const t1 = Math.sqrt(2 * S1.value / 100 / a)
            const t2 = S2.value / 100 / (a * t1)

            let pulleyStartRotation = pulley.rotation

            let tw1 = tweened(0)
            let unsubscribe = tw1.subscribe(t => {
                displayedTime.t1 = t

                const distance =  a * t * t / 2
                const distancePx = distance * pxPerMeter

                loads.leftBottomPx = distancePx
                loads.rightBottomPx = S1px + S2px - distancePx
                pulley.rotation = pulleyStartRotation + distance / (2 * Math.PI * R.value / 100)
            })

            appState = 'falling-phase-1'
            await tw1.set(t1, { duration: t1 * 1000 })
            unsubscribe()

            pulleyStartRotation = pulley.rotation

            let tw2 = tweened(0)
            unsubscribe = tw2.subscribe(t => {
                displayedTime.t2 = t

                const distance = a * t1 * t
                const distancePx = distance * pxPerMeter

                loads.leftBottomPx = S1px + distancePx
                loads.rightBottomPx = S2px - distancePx
                pulley.rotation = pulleyStartRotation + distance / (2 * Math.PI * R.value / 100)
            })

            appState = 'falling-phase-2'
            await tw2.set(t2, { duration: t2 * 1000 })
            unsubscribe()

            appState = 'fall-done'
        })()
    }

    const onClickRepeat = async () => {
        if (appState !== 'fall-done') {
          return
        }

        const ms = {
          phase1: S2px / (S1px + S2px) * 2000,
          phase2: S1px / (S1px + S2px) * 2000
        }

        let pulleyStartRotation = pulley.rotation

        const tw1 = tweened(0)
        let unsubscribe = tw1.subscribe(t1 => {
          const distancePx = S2px * t1 / ms.phase1

          loads.rightBottomPx = distancePx
          loads.leftBottomPx = S1px + S2px - distancePx
          pulley.rotation = pulleyStartRotation - distancePx / (2 * Math.PI * R.value / 100 * pxPerMeter)
        })

        appState = 'raising-phase-1'
        await tw1.set(ms.phase1, { duration: ms.phase1 })
        unsubscribe()

        pulleyStartRotation = pulley.rotation

        const tw2 = tweened(0)
        unsubscribe = tw2.subscribe(t2 => {
          const distancePx = S1px * t2 / ms.phase2

          loads.rightBottomPx = S2px + distancePx
          loads.leftBottomPx = S1px - distancePx
          pulley.rotation = pulleyStartRotation - distancePx / (2 * Math.PI * R.value / 100 * pxPerMeter)
        })

        appState = 'raising-phase-2'
        await tw2.set(ms.phase2, { duration: ms.phase2 })
        unsubscribe()

        appState = 'idle'
    }

    let S1px = $state<number>(0)
    $effect(() => {
        if (appState === 'idle') {
            S1px = pipe(
                () => S1.value,
                calcFr(ranges.physical.S1),
                lerp(ranges.px.S1)
            )()
        }
    })

    let S2px = $state<number>(0)
    $effect(() => {
        if (appState === 'idle') {
            S2px = pipe(
                () => S2.value,
                calcFr(ranges.physical.S2),
                lerp(ranges.px.S2)
            )()
        }
    })

    const pulley = $state({ diameterPx: 0, rotation: 0 })
    $effect(() => {
        if (appState === 'idle') {
            pulley.diameterPx = pipe(
                () => R.value,
                calcFr(ranges.physical.R),
                lerp(ranges.px.pulleyRadius),
                r => r * 2
            )()
        }
    })

    const loads = $state({ sizePx: 0, leftBottomPx: 0, rightBottomPx: 0 })
    $effect(() => {
        if (appState === 'idle') {
            loads.sizePx = pipe(
                () => M.value,
                calcFr(ranges.physical.M),
                lerp(ranges.px.loadSize)
            )()

            loads.leftBottomPx = 0
            loads.rightBottomPx = S1px + S2px
        }
    })

    const leftThreadLengthPx = $derived(sceneHeightPx - loads.leftBottomPx - loads.sizePx)
    const rightThreadLengthPx = $derived(sceneHeightPx - loads.rightBottomPx - loads.sizePx)

    let ringBottomPx = $derived(S2px + loads.sizePx)

    const overload = $state({ sizePx: 0, bottomPx: 0 })
    $effect(() => {
        if (appState === 'idle') {
            overload.sizePx = pipe(
                () => overloadI.value - 1,
                lerp({ min: Math.min(m1.value, m2.value), max: Math.max(m1.value, m2.value) }),
                calcFr(ranges.physical.m),
                lerp(ranges.px.overloadSize)
            )()
        }
    })
    $effect(() => {
        switch (appState) {
            case 'idle':
            case 'falling-phase-1':
            case 'raising-phase-2':
                overload.bottomPx = loads.rightBottomPx + loads.sizePx
                return
            case 'falling-phase-2':
            case 'fall-done':
            case 'raising-phase-1':
                overload.bottomPx = S2px + loads.sizePx
                return
        }
    })

    const displayedTime = $state({
        t1: 0,
        t2: 0
    })
    $effect(() => {
      if (appState === 'idle') {
        displayedTime.t1 = displayedTime.t2 = 0
      }
    })

    let appSizes = appSizeController({ width: 1600, height: 900, minFraction: 16 / 11, maxFraction: 20 / 9 })

</script>

<div class="app" style="width: {appSizes.width}px; height: {appSizes.height}px; scale: {appSizes.scale};">
    <div class="scene-center">
        <div class="scene" style="height: {sceneHeightPx}px; width: {pulley.diameterPx}px;">
            <div class="pulley"
                 style="height: {pulley.diameterPx}px; width: {pulley.diameterPx}px; rotate: {pulley.rotation * 360}deg;"></div>

            <div class="thread"
                 style="left: 0; height: {leftThreadLengthPx}px;"></div>
            <div class="load left-load"
                 style="height: {loads.sizePx}px; width: {loads.sizePx}px; bottom: {loads.leftBottomPx}px;"></div>

            <div class="thread"
                 style="right: 0; height: {rightThreadLengthPx}px;"></div>
            <div class="load right-load"
                 style="height: {loads.sizePx}px; width: {loads.sizePx}px; bottom: {loads.rightBottomPx}px;"></div>

            <div class="ring" style="bottom: {ringBottomPx}px;"></div>

            <div class="overload" style="width: {overload.sizePx}px; height: {overload.sizePx}px; bottom: {overload.bottomPx}px;"></div>
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
                            readonly={appState !== 'idle'}
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
            </section>

            <section style="padding-top: 1.5rem;">
                {#each [M, m1, m2, R, S1, S2] as input}
                    {@render numberInput(input)}
                    <div class="divider"></div>
                {/each}
                <div class="section-element">
                    <input type="radio" value={1} bind:group={overloadI.input} readonly={appState !== 'idle'}/>
                    <input type="radio" value={2} bind:group={overloadI.input} readonly={appState !== 'idle'}/>
                </div>

                <div class="section-element">
                    <button onclick={onClickStart}>Отпустить груз</button>
                </div>
            </section>

            <section style="padding-top: 1.5rem; padding-bottom: 1.5rem;">
                <div class="section-element">
                    <div class="flex">
                        <span>t1 – время 1-го этапа падения (с.)</span>
                        {#if appState === 'falling-phase-1' || appState === 'falling-phase-2' || appState === 'fall-done'}
                            <span>{ displayedTime.t1.toFixed(3) }</span>
                        {/if}
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>t2 – время 2-го этапа падения (с.)</span>
                        {#if appState === 'falling-phase-2' || appState === 'fall-done'}
                            <span>{ displayedTime.t2.toFixed(3) }</span>
                        {/if}
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <button onclick={onClickRepeat}>Поднять груз</button>
                </div>
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

    .overload {
        position: absolute;

        background-size: contain;
        background-position: center center;
        background-repeat: no-repeat;

        background-color: green;

        right: 0;
        translate: 50% 0;
    }

    .thread {
        //width: 1px;
        //background: black;
        position: absolute;
        top: 0;

        width: 4px;
        background: yellow;
    }

    .ring {
        position: absolute;
        width: 50px;
        height: 5px;
        background-color: chocolate;
        right: 0;
        translate: 100% 100%;
    }

</style>
