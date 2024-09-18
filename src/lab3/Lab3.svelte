<script lang="ts">
import { tweened } from 'svelte/motion'
import { untrack } from 'svelte'
import { sceneScale } from '../lib/scene-scale.svelte'
import { inRange, mid, calcFr, lerp, range, type Range } from '../lib/range-util'
import { pipe } from '../lib/pipe'
import { ranges, pxPerSm, variantToNu, variantToAlpha } from './const'
import { vec2 } from '../lib/vector/vector'
import '../lib/ui-kit.scss'

const width = 1600
const height = 900
let scale = sceneScale({ width, height, minFraction: 16 / 9, maxFraction: 16 / 9 })

let appState = $state<'idle' | 'falling-1' | 'falling-2' | 'fall-done' | 'raising'>('idle')

const { sqrt, sin, cos, acos, random } = Math

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
        revealErrorIfInvalid() { if (!valid) showError = true },

        get value() { return value },
        get tweening() { return tweening },

        title,
        placeholder: `От ${range.min} до ${range.max}`
    }
}

// const variant = input({ title: 'Номер варианта', range: range(1, 30) })
// const inputM = input({ title: 'm – массы шаров (г.)', range: ranges.m, tweenMs: 1000 })
// const inputL = input({ title: 'l – длина нити (мм.)', range: range(300, 600), tweenMs: 1000 })
// const inputAlpha = input({ title: 'α – угол отклонения 2 шара (град.)', range: ranges.a, tweenMs: 1000 })
const variant = input({ title: 'Номер варианта', range: range(1, 30), initialValue: 1 })
const inputM = input({ title: 'm – массы шаров (г.)', range: ranges.m, tweenMs: 1000, initialValue: 100 })
const inputL = input({ title: 'l – длина нити (cм.)', range: ranges.L, tweenMs: 1000, initialValue: 60 })
// const inputAlpha = input({ title: 'α – угол отклонения 2 шара (град.)', range: ranges.a, tweenMs: 1000, initialValue: 30 })

const allInputs = [ variant, inputM, inputL ]

const allInputsValid = $derived(allInputs.every(input => input.valid))
const tweening = $derived(allInputs.some(input => input.tweening))

const M = $derived(inputM.value) // граммы
const L = $derived(inputL.value) // миллиметры
const a = $derived(variantToAlpha[variant.value]) // градусы

const Nu = $derived(variantToNu[variant.value])

const pi = 3.1415
const g = 9.81

const r = $derived(pipe(
    M,
    calcFr(ranges.m),
    lerp(ranges.r)
)) // сантиметры

const w = $derived(2 * r) // сантиметры
const h = $derived(L) // сантиметры

const tap = <T>(x: T): T => {
    console.log(x)
    return x
}

// сантиметры
let ball1 = $state(vec2(0))
$effect(() => {
    if (appState === 'idle') {
        ball1 = vec2(-r, 0)
    }
})

// сантиметры
let ball2 = $state(vec2(0))
$effect(() => {
    if (appState === 'idle') {
        ball2 = pipe(
            a * pi / 180,
            angle => vec2(
                sin(angle) * h,
                -cos(angle) * h
            ),
            move => vec2(r, h).op('+', move)
        )
    }
})

// радианы
const thread1Angle = $derived.by(() => {
    const one = ball1.op('-', vec2(-r, h))
    const two = vec2(0, -h)

    const arccos = pipe(
        sqrt(one.dot(one)) * sqrt(two.dot(two)),
        d => one.dot(two) / d,
        acos,
    )

    const cross = one.at('x') * two.at('y') - one.at('y') * two.at('x')

    return cross > 0 ? arccos : - arccos
})

// радианы
const thread2Angle = $derived.by(() => {
    const one = ball2.op('-', vec2(r, h))
    const two = vec2(0, -h)

    const arccos = pipe(
        sqrt(one.dot(one)) * sqrt(two.dot(two)),
        d => one.dot(two) / d,
        acos,
    )

    const cross = one.at('x') * two.at('y') - one.at('y') * two.at('x')

    return cross > 0 ? arccos : - arccos
})

// сантиметры
let magnet = $state(vec2(0))
$effect(() => {
    if (appState === 'idle') {
        magnet = ball2.op('+', vec2(r, 0))
    }
})

let displayedTime = $state(0) // секунды
let displayedBeta = $state(0) // радианы

const fall = async () => {

    let fakeL = L * (random() * 0.1 + 0.95) // сантиметры

    let t1 = 2 * pi * sqrt(fakeL / 100) / sqrt(g) / 4

    const tw1 = tweened(0)
    let unsubscribe = tw1.subscribe(t => {
        displayedTime = t

        ball2 = pipe(
            a * pi / 180,
            aRad => aRad * cos(sqrt(g / (fakeL / 100)) * t),
            ball2Angle => vec2(sin(ball2Angle), -cos(ball2Angle)),
            direction => vec2(r, h).op('+',
                direction.apply(x => x * L)
            )
        )
    })

    appState = 'falling-1'
    await tw1.set(t1, { duration: t1 * 1000 })
    unsubscribe()

    let beta = a * pi / 180 * .8
    beta = beta * (0.95 + 0.1 * random())

    let t2 = t1

    const tw2 = tweened(0)
    unsubscribe = tw2.subscribe(t => {
        displayedBeta = beta * t / t2

        ball1 = pipe(
            beta,
            bRad => bRad * cos(sqrt(g / (fakeL / 100)) * (t2 - t)),
            ball1Angle => vec2(-sin(ball1Angle), -cos(ball1Angle)),
            direction => vec2(-r, h).op('+',
                direction.apply(x => x * L)
            )
        )
    })

    appState = 'falling-2'
    await tw2.set(t2, { duration: t2 * 1000 })
    unsubscribe()

    appState = 'fall-done'

    const aaa = sqrt(1 - cos(a * pi / 180))
    const bbb = sqrt(1 - cos(displayedBeta))

    console.log(cos(a * pi / 180), cos(displayedBeta))

    const studentNu = 2 * (aaa * bbb - bbb * bbb) / (aaa * aaa)

    const studentNu2 = 2 * sqrt((1 - cos(displayedBeta)) * (1 - cos(a * pi / 180))) - 2 * (1 - cos(displayedBeta))

    console.log(`realNu = ${Nu.toFixed(3)}`)
    console.log(`studentNu = ${studentNu.toFixed(3)}`)

    ;(function realBetas() {
        return
        const A = sqrt(1 - cos(a * pi / 180))

        const D = A * A - 2 * A * Nu * Nu * 0.6

        console.log('A = ', A)
        console.log('D = ', D)

        const v1 = 1 - (A + sqrt(D)) * (A + sqrt(D)) / 4
        const v2 = 1 - (A - sqrt(D)) * (A - sqrt(D)) / 4

        console.log('v1 = ', v1)
        console.log('v2 = ', v2)

        const beta1 = acos(1 - (A + sqrt(D)) * (A + sqrt(D)) / 4)
        const beta2 = acos(1 - (A - sqrt(D)) * (A - sqrt(D)) / 4)

        console.log('beta1 = ', beta1 / pi * 180)
        console.log('beta2 = ', beta2 / pi * 180)

    })()
}

const onClickStart = () => {
    if (appState !== 'idle') {
      return
    }

    if (!allInputsValid) {
        allInputs.forEach(input => input.revealErrorIfInvalid())
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

    let t1 = .6 // секунды

    const tw1 = tweened(0)
    let unsubscribe = tw1.subscribe(t => {
        ball1 = pipe(
            displayedBeta * (t1 - t) / t1,
            ball1Angle => vec2(-sin(ball1Angle), -cos(ball1Angle)),
            direction => vec2(-r, h).op('+',
                direction.apply(x => x * L)
            )
        )
    })

    appState = 'raising'
    await tw1.set(t1, { duration: t1 * 1000 })
    unsubscribe()

    await new Promise(res => setTimeout(res, 100))

    const tw2 = tweened(0)
    unsubscribe = tw2.subscribe(t => {
        ball2 = pipe(
            a * pi / 180,
            targetAngle => targetAngle * t / t1,
            ball2Angle => vec2(sin(ball2Angle), -cos(ball2Angle)),
            direction => vec2(r, h).op('+',
                direction.apply(x => x * L)
            )
        )
    })

    await tw2.set(t1, { duration: t1 * 1000 })

    appState = 'idle'
}

</script>

<div class="app" style="width: {width}px; height: {height}px; scale: {scale.value};">
    <div class="scene-center">
        <div class="thread" style="left: {-r * pxPerSm}px; bottom: {h * pxPerSm}px; height: {h * pxPerSm}px; rotate: {thread1Angle}rad;"></div>
        <div class="ball" style="left: {ball1.at('x') * pxPerSm}px; bottom: {ball1.at('y') * pxPerSm}px; width: {2 * r * pxPerSm}px; height: {2* r * pxPerSm}px;"></div>

        <div class="thread" style="left: {r * pxPerSm}px; bottom: {h * pxPerSm}px; height: {h * pxPerSm}px; rotate: {thread2Angle}rad;"></div>
        <div class="ball" style="background: blue; bottom: {ball2.at('y') * pxPerSm}px; left: {ball2.at('x') * pxPerSm}px; width: {2 * r * pxPerSm}px; height: {2* r * pxPerSm}px;"></div>

        <div class="magnet" style="left: {magnet.at('x') * pxPerSm}px; bottom: {magnet.at('y') * pxPerSm}px;">
        </div>

        <!-- <div style="border: 1px solid green; position: absolute; bottom: 0px; left: 0px; translate: -50% 0; width: {w * pxPerSm}px; height: {h * pxPerSm}px;"></div> -->
    </div>

    <div class="ui-holder">
        <div class="ui" style="width: 500px;">
            <h1>Лабораторная работа №3</h1>

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
                {#each [inputL, inputM] as input}
                    {@render numberInput(input)}
                    <div class="divider"></div>
                {/each}

                <div class="section-element">
                    <div class="flex">
                        <span>α – угол отклонения 2 шара (град.)</span>
                        {#if a }
                            <span>{ (a).toFixed(1) }</span>
                        {/if}
                    </div>
                </div>
                <div class="divider"></div>

                <div class="section-element">
                    <button class="fw-button" onclick={onClickStart}>Отпустить шар</button>
                </div>
            </section>

            <section style="padding-top: 1rem; padding-bottom: 1rem;">
                <div class="section-element">
                    <div class="flex">
                        <span>t – время столкновения шаров (c.)</span>
                        {#if appState === 'falling-1' || appState === 'falling-2' || appState === 'fall-done'}
                            <span>{ displayedTime.toFixed(3) }</span>
                        {/if}
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>β – угол отклонения 1 шара (град.)</span>
                        {#if appState === 'falling-1' || appState === 'falling-2' || appState === 'fall-done'}
                            <span>{ (displayedBeta / pi * 180).toFixed(1) }</span>
                        {/if}
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <button class="fw-button" onclick={onClickRepeat}>Поднять шары</button>
                </div>
            </section>
        </div>
    </div>
</div>

<style>
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .app {
        position: fixed;
        left: 50%;
        top: 50%;
        translate: -50% -50%;
        background-size: contain;
        /* background-image: url("./assets/bg.jpg"); */
        background-repeat: no-repeat;
    }

    .scene-center {
        position: absolute;

        width: 1px;
        height: 1px;

        bottom: 250px;
        right: 550px;
        /* border: 5px solid red; */
    }

    .scene {
        position: absolute;
        border: 1px solid blue;
        bottom: 0;
        left: 50%;
        translate: -50% 0;
    }

    .thread {
        width: 2px;
        background: black;
        position: absolute;
        translate: -50% 100%;
        transform-origin: top center;
    }

    .ball {
        background: red;
        border-radius: 50%;
        position: absolute;
        translate: -50% 50%;
    }

    .magnet {
        background: orange;
        width: 10px;
        height: 30px;
        position: absolute;
        translate: 0 50%;
    }

</style>
