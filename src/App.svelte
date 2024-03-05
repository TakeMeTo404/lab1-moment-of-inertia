<script lang="ts">
    import { tweened } from 'svelte/motion'
    import { mRange, dRange, dRangePx, containerHeightPx, flywheelDiameterPx, loadDiameterPx } from './const'
    import { width, height, scale } from './sizes'

    type State = 'idle' | 'falling' | 'fall-done'

    let state: State = 'idle'

    let m = mRange[0]
    let d = (dRange[0] + dRange[1]) / 2
    let n1 = 3
    const I = 0.204
    const g = 9.81
    const al = .07

    let t: number
    let n2: number
    $: {
        console.group()
        console.log(`m = ${m.toFixed(2)}кг.`)
        console.log(`d = ${d.toFixed(3)}м.`)
        console.log(`n1 = ${n1.toFixed(1)}`)
        console.log(`I = ${I.toFixed(3)}кг*м^2`)
        console.log(`alpha = ${al.toFixed(3)}`)

        const A1 = -al * n1
        const M = al / (2 * Math.PI)
        console.log(`M = ${M.toFixed(3)}`)
        const R = d / 2

        const a = (m * g * R + M) / (m * R + I / R)

        const H = Math.PI * d * n1

        t = Math.sqrt(2 * H / a)

        const w = 2 * H / (R * t)

        n2 = -I * w ** 2 * n1 / (2 * A1)

        // t = 6.8
        // t = t * 1.2

        // t = 8

        const x = m * R * R * (g * t * t - 2 * H) / (2 * H * I)

        // const x = m * R**2 * (g * t**2 - 2*H) / (2 * H * I)
        // console.log('x= ', x)
        // n2 = n1 / (x - 1)

        /* этот checkI получается такой же, как и I */
        // const checkI = m * d**2 * t**2 * g / (8 * H * (1 + n1/n2))
        // console.log(`I=${I.toFixed(2)}, checkI=${checkI.toFixed(2)}`)

        const studentI = m * d ** 2 * t ** 2 * g / (8 * H * (1 + n1 / n2))

        console.log('')
        console.log(`t = ${t.toFixed(2)}сек.`)
        console.log(`n2 = ${n2.toFixed(1)}`)
        console.log('')
        console.log(`studentI= ${studentI}`)
        console.groupEnd()

        // t = 6.4
        // n2 = 91

        /* console.group('Подставляю')
         console.log(`m = ${m}`)
         console.log(`d = ${d}`)
         console.log(`t = ${t}`)
         console.log(`g = ${g}`)
         console.log(`H = ${H}`)
         console.log(`n1 = ${n1}`)
         console.log(`n2 = ${n2}`)
         console.groupEnd()
         console.group('Получаю')
         const IFinal = m * d**2 * t**2 * g / (8 * H * (1 + n1/n2))
         console.log(`I = ${IFinal}`)
         console.groupEnd()*/
    }

    let pulleyDiameterPx = dRangePx[0]
    $: {
        const fr = (d - dRange[0]) / (dRange[1] - dRange[0])
        pulleyDiameterPx = dRangePx[0] + (dRangePx[1] - dRangePx[0]) * fr
    }

    let loadBeginFallTopPx = 0
    let loadEndFallTopPx = 0
    $: {
        loadEndFallTopPx = containerHeightPx - loadDiameterPx

        loadBeginFallTopPx = containerHeightPx - (loadDiameterPx + n1 * pulleyDiameterPx * Math.PI)
    }

    let loadPositionPx: number
    $: {
        if (state === 'idle') {
            loadPositionPx = loadBeginFallTopPx
        }
    }

    let threadTopPx: number = flywheelDiameterPx / 2
    let threadLeftPx: number
    let threadLengthPx: number
    $: threadLeftPx = flywheelDiameterPx / 2 + pulleyDiameterPx / 2 - 2
    $: threadLengthPx = loadPositionPx - flywheelDiameterPx / 2

    let disksRotation = 0

    let loadFallingTime: number = 0
    let disksRotationsDone: number = 0
    let disksRotationDoneDisplayed: number
    $: disksRotationDoneDisplayed = Math.floor(disksRotationsDone * 4) / 4

    const onClickStart = async () => {
        state = 'falling'

        const t1Tweened = tweened(0)

        let unsubscribes = [
            t1Tweened.subscribe(t1 => loadFallingTime = t1),
            t1Tweened.subscribe(t1 => {
                const H = loadEndFallTopPx - loadBeginFallTopPx
                loadPositionPx = loadBeginFallTopPx + H * t1 * t1 / (t * t)
            }),
            t1Tweened.subscribe(t1 => {
                disksRotation = n1 * t1 * t1 / (t * t)
            })
        ]

        await t1Tweened.set(t, { duration: t * 1000 })
        unsubscribes.forEach(u => u())

        const t2Tweened = tweened(0)
        const t2 = t * n2 / n1

        unsubscribes = [
            t2Tweened.subscribe(t2 => {
                disksRotation = n1
                    + 2 * n1 * t2 / t
                    - (n1 ** 2 * t2 ** 2) / (t ** 2 * n2)
            }),
            t2Tweened.subscribe(t2 => {
                disksRotationsDone =
                    2 * n1 * t2 / t
                    - (n1 ** 2 * t2 ** 2) / (t ** 2 * n2)
            })
        ]

        await t2Tweened.set(t2, { duration: t2 * 1000 })
        unsubscribes.forEach(u => u())

        state = 'fall-done'
    }

    const onClickNew = () => {
        loadPositionPx = loadBeginFallTopPx
        disksRotation = 0
        loadFallingTime = 0
        disksRotationsDone = 0

        state = 'idle'
    }

    const onInputM = (e: Event & { currentTarget: HTMLInputElement, target: HTMLInputElement }) => {
        const value = parseFloat(e.target.value)
        if (!isNaN(value)) {
            m = value
        }
    }
    const onInputD = (e: InputEvent & { currentTarget: HTMLInputElement, target: HTMLInputElement }) => {
        const value = parseFloat(e.target.value)
        if (!isNaN(value)) {
            d = value
        }
    }
    const onInputN1 = (e: InputEvent & { currentTarget: HTMLInputElement, target: HTMLInputElement }) => {
        const value = parseFloat(e.target.value)
        if (!isNaN(value)) {
            n1 = value
        }
    }
</script>

<div class="app" style="width: {width}px; height: {height}px; --scale: {$scale};">
    <div class="ui-holder to-left">
        <div class="ui">
            <div class="experiment-counter">
                Эксперимент №1
            </div>
            <section class="input">
                <div class="section-element">
                    <div class="flex">
                        <span>m – Масса груза (кг)</span>
                        <input type="number" max={mRange[0]} min={mRange[1]} step=".1" placeholder="Введите m..." on:input={onInputM} />
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>d – Диаметр шкива (м)</span>
                        <input type="number" max={dRange[0]} min={dRange[1]} step=".05" placeholder="Введите d..." on:input={onInputD} />
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>n1 – Количество оборотов</span>
                        <input type="number" max="4" min="3" step="1" placeholder="Введите n1..." on:input={onInputN1} />
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <button on:click={onClickStart}>Отпустить груз</button>
                </div>
            </section>
            <section class="output">
                <div class="section-element">
                    <div class="flex">
                        <span>t – Время падения груза (с)</span>
                        <span>{ loadFallingTime.toFixed(1) }</span>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>n2 – Обороты после падения груза</span>
                        <span>{ disksRotationDoneDisplayed.toFixed(2) }</span>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <button class="blue" on:click={onClickNew}>Поднять груз</button>
                </div>
            </section>
            <section>
                <div style="height: 2rem;"></div>
            </section>
        </div>
    </div>

    <div class="physics-container" style="height: {containerHeightPx}px; width: {flywheelDiameterPx}px;">
        <div class="flywheel disk"
             style="width: {flywheelDiameterPx}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="pulley disk"
             style="width: {pulleyDiameterPx}px; top: {flywheelDiameterPx / 2 - pulleyDiameterPx / 2}px; left: {flywheelDiameterPx / 2 - pulleyDiameterPx / 2}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="load"
             style="width: {loadDiameterPx}px; height: {loadDiameterPx}px; left: {threadLeftPx - loadDiameterPx / 2}px; top: {loadPositionPx}px;"></div>
        <div class="thread" style="height: {threadLengthPx}px; top: {threadTopPx}px; left: {threadLeftPx}px"></div>
    </div>
</div>

<style lang="scss">
    .app {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%) scale(var(--scale));
        border: 1px solid black;
        background-image: url("./assets/bg.jpg");
        background-size: contain;
        background-repeat: no-repeat;
    }

    .ui-holder {
        position: fixed;
        top: 50%;
        translate: -50% -50%;
        width: fit-content;
        height: fit-content;

        &.centered {
            left: 50%;
        }

        &.to-left {
            left: 33%;
        }

        .ui {
            background: hsla(12 0% 60% / 30%);
            backdrop-filter: blur(10px);
            border-radius: 2rem;

            width: 400px;
            min-height: 500px;

            .experiment-counter {
                padding-top: 1.5rem;
                font-size: 1.5rem;
                color: white;
                text-align: center;
                font-weight: bold;
            }

            section {
                padding: 0 1rem;

                &.input {
                    padding-top: 2rem;
                }

                &.output {
                    padding-top: 2rem;
                }

                .section-element {
                    backdrop-filter: brightness(10%);
                    background-clip: text;
                    padding: 1rem;

                    .flex {
                        display: flex;
                        align-items: baseline;
                        justify-content: space-between;

                        span {
                            color: white;
                            font-size: 1rem;
                            background-color: transparent;
                        }

                        input {
                            border:0;
                            outline:0;
                            -webkit-appearance: none;
                            background: transparent;
                            font-size: 16px;
                            text-align: right;
                            width: 100px;
                            color: white;
                            font-style: italic;

                            &::placeholder {
                                color: hsla(12 0% 60% / 20%);
                                font-style: normal;
                            }

                            &:focus, &:valid {
                                border: none;
                                outline:none!important;
                            }

                            &::-webkit-outer-spin-button,
                            &::-webkit-inner-spin-button {
                                -webkit-appearance: none;
                                margin: 0;
                            }

                            &[type=number] {
                                -moz-appearance: textfield;
                            }
                        }
                    }

                    button {
                        border: none;
                        text-align: center;
                        width: 100%;
                        display: block;

                        font-size: 1rem;
                        font-weight: bold;
                        color: white;

                        border-radius: 2rem;
                        padding: .5rem;
                        cursor: pointer;

                        background: hsla(12 0% 60% / 20%);

                        &.blue {
                            background: transparent;
                            color: #3070B9;
                        }
                    }

                    &:first-child {
                        border-top-left-radius: 1rem;
                        border-top-right-radius: 1rem;
                    }
                    &:last-child {
                        border-bottom-left-radius: 1rem;
                        border-bottom-right-radius: 1rem;
                    }
                }

                .divider {
                    height: 1px;
                }
            }
        }
    }

    .physics-container {
        position: absolute;
        left: 950px;
        bottom: 130px;

        .disk {
            position: absolute;
            aspect-ratio: 1;

            background-size: contain;
            background-position: center center;
            transform-origin: center center;
            background-repeat: no-repeat;
        }

        .flywheel {
            left: 0;
            top: 0;
            background-image: url("./assets/flywheel.png");
        }

        .pulley {
            background-image: url("./assets/pulley.png");
        }

        .load {
            position: absolute;

            aspect-ratio: 1;
            background-image: url("./assets/load.png");
            background-position: center center;
            background-size: contain;
            background-repeat: no-repeat;
        }

        .thread {
            position: absolute;

            background-color: black;
            width: 1px;
            height: 100px;
            left: 300px;
        }
    }
</style>
