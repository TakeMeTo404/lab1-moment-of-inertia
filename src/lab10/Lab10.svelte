<script lang="ts">
    import { pipe } from 'lodash/fp'
    import { tweened } from 'svelte/motion'
    import { random } from 'lodash'
    import { variantToI, ranges, sceneHeightPx, sceneHeight, variantRange, pxPerSm } from './const'
    import type { Range } from '../lib/range-util'
    import { inRange, mid, calcFr, lerp, range } from '../lib/range-util'
    import { untrack } from 'svelte';
    import '../lib/ui-kit.scss'
    import { appScaler } from '../lib/app-scaler.svelte';

    let appSizes = appScaler({ width: 1600, height: 900, minFraction: 12 / 9, maxFraction: 16 / 9 })
    let appState = $state<'idle' | 'falling-phase-1' | 'falling-phase-2' | 'fall-done' | 'raising-phase-1' | 'raising-phase-2'>('idle')

    type InputConfig = { title: string, range: Range, tweenMs?: number, initialValue?: number }
    const input = ({
        title,
        range,
        tweenMs,
        initialValue
    }: InputConfig) => {

        let input = $state<number>(initialValue as any)
        let error = $derived.by(() => {
            if (input === undefined || input === null || input as any === '') {
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
            revealErrorIfIтvalid() { if (!valid) showError = true },

            get value() { return value },
            get tweening() { return tweening },

            title,
            placeholder: `От ${range.min} до ${range.max}`
        }
    }

    const variant = input({ title: 'Номер варианта', range: variantRange })
    const inputM = input({ title: 'M – масса грузов (г.)', range: ranges.M, tweenMs: 1000 })
    const inputM1 = input({ title: 'm1 – масса 1 перегрузка (г.)', range: ranges.m, tweenMs: 1000 })
    const inputM2 = input({ title: 'm2 – масса 1 перегрузка (г.)', range: ranges.m, tweenMs: 1000 })
    const inputR = input({ title: 'R – радиус шкива (см.)', range: ranges.R, tweenMs: 1000 })
    const inputS1 = input({ title: 'S1 – расстояние (см.)', range: ranges.S1, tweenMs: 1000 })
    const inputS2 = input({ title: 'S2 – расстояние (см.)', range: ranges.S2, tweenMs: 1000 })
    const overloadI = input({ title: '', range: { min: 1, max: 2 }, tweenMs: 500 })
    // const variant = input({ title: 'Номер варианта', range: variantRange, initialValue: random(1, 30) })
    // const inputM = input({ title: 'M – масса грузов (г.)', range: ranges.M, tweenMs: 1000, initialValue: random(50, 100) })
    // const inputM1 = input({ title: 'm1 – масса 1 перегрузка (г.)', range: ranges.m, tweenMs: 1000, initialValue: random(5, 20) })
    // const inputM2 = input({ title: 'm2 – масса 1 перегрузка (г.)', range: ranges.m, tweenMs: 1000, initialValue: random(5, 20) })
    // const inputR = input({ title: 'R – радиус шкива (см.)', range: ranges.R, tweenMs: 1000, initialValue: random(6, 10) })
    // const inputS1 = input({ title: 'S1 – расстояние (см.)', range: ranges.S1, tweenMs: 1000, initialValue: random(10, 20) })
    // const inputS2 = input({ title: 'S2 – расстояние (см.)', range: ranges.S2, tweenMs: 1000, initialValue: random(10, 20) })
    // const overloadI = input({ title: '', range: { min: 1, max: 2 }, tweenMs: 500, initialValue: random(1, 2) })

    const allInputs = [variant, inputM, inputM1, inputM2, inputR, inputS1, inputS2, overloadI]

    const allInputsValid = $derived(allInputs.every(input => input.valid))
    const tweening = $derived(allInputs.some(input => input.tweening))

    const M = $derived(inputM.value)
    const m1 = $derived(inputM1.value)
    const m2 = $derived(inputM2.value)
    const R = $derived(inputR.value)
    const S1 = $derived(inputS1.value)
    const S2 = $derived(inputS2.value)

    const g = 9.81
    const pi = 3.1415
    const rnd = Math.random()

    /* L – loads size in sm. h1/h2 – heights of left and right loads */
    let L = $state(0)
    let h1 = $state(0)
    let h2 = $state(0)
    $effect(() => {
      if (appState === 'idle') {
        h1 = 0
        h2 = S1 + S2
      }
    })
    $effect(() => {
      if (appState === 'idle') {
        L = pipe(
          calcFr(ranges.M),
          lerp(ranges.L)
        )(M)
      }
    })

    let overload = $state({ size: 0, bottom: 0 })
    $effect(() => {
      overload.size = pipe(
        () => overloadI.value - 1,
        lerp({ min: Math.min(m1, m2), max: Math.max(m1, m2) }),
        calcFr(ranges.m),
        lerp(ranges.O)
      )()
    })
    $effect(() => {
        switch (appState) {
            case 'idle':
            case 'falling-phase-1':
            case 'raising-phase-2':
                overload.bottom = h2 + L
                return
            case 'falling-phase-2':
            case 'fall-done':
            case 'raising-phase-1':
                overload.bottom = S2 + L
                return
        }
    })

    let alpha = $state(Math.random())

    const displayedTime = $state({
        t1: 0,
        t2: 0
    })

    const acceleration = (): number => {
      const I = pipe(
          v => variantToI[v],
          I => I * random(.9, 1.1, true)
      )(variant.value)

      const [a1, a2] = (function () {
          if (m2 <= m1) {
            let minA1 =
              (R ** 2) * (m1 - m2) * g
              /
              (I + (R**2) * (2 * M + m1))
            minA1 += .1
            const maxA1 = minA1 + .5

            const frM1 = calcFr(ranges.m)(m1)
            const frI = calcFr(range(ranges.I.min * .9, ranges.I.max * 1.1))(I)
            const frRnd = Math.random()
            const fr = (frM1 + frI + frRnd) / 3

            const a1 = minA1 + (maxA1 - minA1) * fr
            // console.log(`rnd = ${rnd}`)
            const a2 = (a1 * (I + (R**2) * (2 * M + m1)) - (R ** 2) * (m1 - m2) * g) /
              (I + (R**2) * (2 * M + m2))

            return [a1, a2]
          }
          else {

            let minA2 = ((0) * (I + (R**2) * (2 * M + m1)) - (R ** 2) * (m1 - m2) * g) /
              (I + (R**2) * (2 * M + m2))
            minA2 += .1
            const maxA2 = minA2 + .5

            const frM2 = calcFr(ranges.m)(m2)
            const frI = calcFr(range(ranges.I.min * .9, ranges.I.max * 1.1))(I)
            const frRnd = Math.random()
            const fr = (frM2 + frI + frRnd) / 3

            const a2 = minA2 + (maxA2 - minA2) * fr
            // console.log(`inverse rnd = ${rnd}`)

            const a1 =
              (a2 * (I + R**2 * (2 * M + m2)) + R**2 * (m1 - m2) * g)
              /
              (I + R**2 * (2*M + m1))

            return [a1, a2]
          }
      })()
      console.log(`a1 = ${a1.toFixed(3)}\ta2 = ${a2.toFixed(3)}`)

      const studentI = R**2 / (a1 - a2) * ((m1 - m2) * g - a1 * (2 * M + m1)+ a2 * (2 * M + m2))
      console.log(`I = ${I.toFixed(6)}\tstudentI = ${studentI.toFixed(6)}\tdiff = ${Math.abs(I - studentI).toFixed(6)}`)

      return overloadI.value === 1 ? a1: a2
    }

    const fall = async () => {
        console.log("")
        const a = acceleration()

        console.log(`a = ${a}`)

        const t1 = Math.sqrt(2 * S1 / 100 / a)
        const t2 = S2 / 100 / (a * t1)

        let pulleyStartRotation = alpha

        let tw1 = tweened(0)
        let unsubscribe = tw1.subscribe(t => {
            displayedTime.t1 = t

            const distance =  a * t * t / 2 * 100

            h1 = distance
            h2 = S1 + S2 - distance
            alpha = pulleyStartRotation + distance / (2 * pi * R)
        })

        appState = 'falling-phase-1'
        await tw1.set(t1, { duration: t1 * 1000 })
        unsubscribe()

        pulleyStartRotation = alpha

        let tw2 = tweened(0)
        unsubscribe = tw2.subscribe(t => {
            displayedTime.t2 = t

            const distance = a * t1 * t * 100

            h1 = S1 + distance
            h2 = S2 - distance
            alpha = pulleyStartRotation + distance / (2 * pi * R)
        })

        appState = 'falling-phase-2'
        await tw2.set(t2, { duration: t2 * 1000 })
        unsubscribe()

        appState = 'fall-done'
    }

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

        fall()
    }

    const onClickRepeat = async () => {
        if (appState !== 'fall-done') {
          return
        }

        const ms = {
          t1: S2 / (S1 + S2) * 2000,
          t2: S1 / (S1 + S2) * 2000
        }

        let pulleyStartRotation = alpha

        const tw1 = tweened(0)
        let unsubscribe = tw1.subscribe(t => {
          const distance = S2 * t / ms.t1

          h2 = distance
          h1 = S1 + S2 - distance
          alpha = pulleyStartRotation - distance / (2 * pi * R)
        })

        appState = 'raising-phase-1'
        await tw1.set(ms.t1, { duration: ms.t1 })
        unsubscribe()

        pulleyStartRotation = alpha

        const tw2 = tweened(0)
        unsubscribe = tw2.subscribe(t => {
          const distance = S1 * t / ms.t2

          h2 = S2 + distance
          h1 = S1 - distance
          alpha = pulleyStartRotation - distance / (2 * pi * R)
        })

        appState = 'raising-phase-2'
        await tw2.set(ms.t2, { duration: ms.t2 })
        unsubscribe()

        appState = 'idle'
    }

</script>
<div class="app" style="width: {appSizes.width}px; height: {appSizes.height}px; scale: {appSizes.scale};">
    <div class="scene-center">
        <div class="scene" style="height: {sceneHeightPx}px; width: {2 * R * pxPerSm}px;">

            <div class="pulley" style="height: {2 * R * pxPerSm}px; width: {2 * R * pxPerSm}px; rotate: {alpha * 360}deg;"></div>
            <div class="thread" style="left: 0; height: {(sceneHeight - L - h1) * pxPerSm}px;"></div>
            <div class="thread" style="right: 0; height: {(sceneHeight - L - h2) * pxPerSm}px;"></div>

            <div class="load left-load" style="height: {L * pxPerSm}px; width: {L * pxPerSm}px; bottom: {h1 * pxPerSm}px;"></div>
            <div class="load right-load" style="height: {L * pxPerSm}px; width: {L * pxPerSm}px; bottom: {h2 * pxPerSm}px;"></div>
            <div class="overload" style="width: {overload.size * pxPerSm}px; height: {overload.size * pxPerSm}px; bottom: {overload.bottom * pxPerSm}px;"></div>

            <div class="ring" style="bottom: {(S2 + L) * pxPerSm}px;"></div>
        </div>
    </div>

    <div class="ui-holder">
        <div class="ui">
            <h1>Лабораторная работа №10</h1>

            {#snippet numberInput(input)}
                <div class="section-element with-input">
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

            <section style="padding-top: 1.5rem;">
                {@render numberInput(variant)}
            </section>

            <section style="padding-top: 1rem;">
                {#each [inputM, inputM1, inputM2, inputR, inputS1, inputS2] as input}
                    {@render numberInput(input)}
                    <div class="divider"></div>
                {/each}
                <div class="section-element with-input">
                    <div class="flex">
                        <span>Номер перегрузка</span>
                        <div class="button-group">
                            <button
                                class:selected={overloadI.input === 1}
                                onclick={() => {if (appState === 'idle') overloadI.input = 1}}
                            >1</button>
                            <button
                                class:selected={overloadI.input === 2}
                                onclick={() => {if (appState === 'idle') overloadI.input = 2}}
                            >2</button>
                        </div>
                        {#if !overloadI.valid && overloadI.showError}
                            <span class="error red">{ overloadI.error }</span>
                        {/if}
                    </div>
                </div>

                <div class="section-element">
                    <button class="fw-button" onclick={onClickStart}>Отпустить груз</button>
                </div>
            </section>

            <section style="padding-top: 1rem; padding-bottom: 1rem;">
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
                    <button class="fw-button" onclick={onClickRepeat}>Поднять груз</button>
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

        width: 1px;
        height: 1px;

        top: 400px;
        right: 450px;
    }

    .scene {
        position: absolute;

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

        &.left-load {
            background-image: url("./assets/load1.png");
            left: 0;
            translate: -50% 0;
        }

        &.right-load {
            background-image: url("./assets/load2.png");
            right: 0;
            translate: 50% 0;
        }
    }

    .overload {
        position: absolute;

        background-size: contain;
        background-position: center center;
        background-repeat: no-repeat;

        background-color: red;

        right: 0;
        translate: 50% 0;
    }

    .thread {
        width: 2px;
        background: black;
        position: absolute;
        top: 0;

        /* width: 4px;
        background: yellow; */
    }

    .ring {
        position: absolute;
        width: 50px;
        height: 5px;
        background-color: red;
        right: 0;
        translate: 100% 100%;
    }

</style>
