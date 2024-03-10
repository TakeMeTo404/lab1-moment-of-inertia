<script lang="ts">
    import { tweened } from 'svelte/motion'
    import { quadInOut } from 'svelte/easing'
    import {
        mRange,
        dRange,
        dRangePx,
        n1Range,
        containerHeightPx,
        flywheelDiameterPx,
        variantToI,
        loadDiameterRangePx
    } from './const'
    import { width, height, scale } from './sizes'

    let appState: 'idle' | 'targeting' | 'falling' | 'fall-done' = 'idle'
    let error: string = ''

    let variantNumber: number | null
    let I: number
    $: I = variantToI[variantNumber ?? 1] ?? variantToI[1]

    let m: number | null = null
    let d: number | null = null
    let n1: number

    /*$: {
        if (appState == 'idle' || appState === 'targeting') {
            const mm: number = m ?? (mRange[0] + mRange[1]) / 2
            const dd: number = d ?? (dRange[0] + dRange[1]) / 2
            const n1n1: number = n1 ?? 0

            const mFr = (mm - mRange[0]) / (mRange[1] - mRange[0])
            const dFr = (dd - dRange[0]) / (dRange[1] - dRange[0])

            const loadDiameterPx = loadDiameterRangePx[0] + (loadDiameterRangePx[1] - loadDiameterRangePx[0]) * mFr
            const pulleyDiameterPx = dRangePx[0] + (dRangePx[1] - dRangePx[0]) * dFr
            const loadPositionPx = containerHeightPx - loadDiameterPx - n1n1 * pulleyDiameterPx * Math.PI

            let targetState: PhysicsState = {
                pulleyDiameterPx,
                loadDiameterPx,
                loadPositionPx,
                systemRotation: -n1n1 - 5
            }

            appState = 'targeting'
            physicsStateTweened.set(targetState, { duration: 500 })
                .then(() => appState = 'idle')
        }
    }*/

    let t: number = 5
    let n2: number = 10
    /*$: {
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

        /!* этот checkI получается такой же, как и I *!/
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

        /!* console.group('Подставляю')
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
         console.groupEnd()*!/
    }*/

    type PhysicsState = {
        pulleyDiameterPx: number
        systemRotation: number
        loadPositionPx: number
        loadDiameterPx: number
    }

    let currentPulleyDiameterPx: number
    let currentSystemRotation: number
    let currentLoadPositionPx: number
    let currentLoadDiameterPx: number

    const physicsStateTweened = tweened<PhysicsState>(calculateTargetPhysicsState())
    physicsStateTweened.subscribe((currentState) => {
        if ((appState !== 'idle' && appState !== 'targeting') || !currentState) {
            return
        }

        currentSystemRotation = currentState.systemRotation
        currentLoadDiameterPx = currentState.loadDiameterPx
        currentLoadPositionPx = currentState.loadPositionPx
        currentPulleyDiameterPx = currentState.pulleyDiameterPx
    })

    let threadTopPx: number = flywheelDiameterPx / 2
    let threadLeftPx: number
    let threadLengthPx: number
    $: threadLeftPx = flywheelDiameterPx / 2 + currentPulleyDiameterPx / 2 - 2
    $: threadLengthPx = currentLoadPositionPx - flywheelDiameterPx / 2

    let loadFallingTime: number = 0
    let disksRotationsDone: number = 0
    let disksRotationDoneDisplayed: number
    $: disksRotationDoneDisplayed = Math.floor(disksRotationsDone * 4) / 4

    function calculateTargetPhysicsState (): PhysicsState {
        const mm: number = m ?? (mRange[0] + mRange[1]) / 2
        const dd: number = d ?? (dRange[0] + dRange[1]) / 2
        const n1n1: number = n1 ?? 0

        const mFr = (mm - mRange[0]) / (mRange[1] - mRange[0])
        const dFr = (dd - dRange[0]) / (dRange[1] - dRange[0])

        const loadDiameterPx = loadDiameterRangePx[0] + (loadDiameterRangePx[1] - loadDiameterRangePx[0]) * mFr
        const pulleyDiameterPx = dRangePx[0] + (dRangePx[1] - dRangePx[0]) * dFr
        const loadPositionPx = containerHeightPx - loadDiameterPx - n1n1 * pulleyDiameterPx * Math.PI

        return {
            pulleyDiameterPx,
            loadDiameterPx,
            loadPositionPx,
            systemRotation: -n1n1
        }
    }

    const calculateTimeOfMovingTo = (targetState: PhysicsState) => {
        const loadPositionRangePx = [
            containerHeightPx - loadDiameterRangePx[1] - n1Range[1] * dRangePx[1] * Math.PI,
            containerHeightPx - loadDiameterRangePx[0]
        ] as const

        const delta: PhysicsState = {
            systemRotation: Math.abs(currentSystemRotation - targetState.systemRotation),
            pulleyDiameterPx: Math.abs(currentPulleyDiameterPx - targetState.pulleyDiameterPx),
            loadDiameterPx: Math.abs(currentLoadDiameterPx - targetState.loadDiameterPx),
            loadPositionPx: Math.abs(currentLoadPositionPx - targetState.loadPositionPx)
        }

        const frs: PhysicsState = {
            systemRotation: delta.systemRotation / (n1Range[1] - n1Range[0]),
            pulleyDiameterPx: delta.pulleyDiameterPx / (dRangePx[1] - dRangePx[0]),
            loadDiameterPx: delta.loadDiameterPx / (loadDiameterRangePx[1] - loadDiameterRangePx[0]),
            loadPositionPx: delta.loadPositionPx / (loadPositionRangePx[1] - loadPositionRangePx[0]),
        }

        const coefficients: PhysicsState = {
            systemRotation: 1,
            pulleyDiameterPx: 1,
            loadDiameterPx: 1,
            loadPositionPx: 1,
        }

        console.log(delta)
        console.log(frs)
        console.log(Object.entries(coefficients))

        const fr =
            Object.entries(coefficients)
                .map(([key, value]) => value * frs[key as keyof PhysicsState])
                .reduce((acc, c) => acc + c, 0) /
            Object.values(coefficients).reduce((acc, c) => acc + c, 0)
        console.log(fr)

        return fr * 3000
    }

    const updatePhysicsTarget = async () => {
        appState = 'targeting'
        const newState = calculateTargetPhysicsState()
        const duration = calculateTimeOfMovingTo(newState)
        await physicsStateTweened.set(newState, { duration, easing: quadInOut })
        appState = 'idle'
    }

    const onClickStart = async () => {
        if (appState !== 'idle') {
            return
        }

        if (!variantNumber) {
            return error = 'Введите номер варианта'
        }
        if (!m) {
            return error = 'Введите массу груза m'
        }
        if (!d) {
            return error = 'Введите диаметр шкива d'
        }
        if (!n1) {
            return error = 'Введите количество оборотов n1'
        }

        appState = 'falling'

        const loadEndFallTopPx = containerHeightPx - currentLoadDiameterPx
        const loadBeginFallTopPx = containerHeightPx - (currentLoadDiameterPx + n1 * currentPulleyDiameterPx * Math.PI)

        const t1Tweened = tweened(0)
        const H = loadEndFallTopPx - loadBeginFallTopPx

        let unsubscribes = [
            t1Tweened.subscribe(t1 => loadFallingTime = t1),
            t1Tweened.subscribe(t1 => {
                currentLoadPositionPx = loadBeginFallTopPx + H * t1 * t1 / (t * t)
            }),
            t1Tweened.subscribe(t1 => {
                currentSystemRotation = n1 * t1 * t1 / (t * t)
            })
        ]

        await t1Tweened.set(t, { duration: t * 1000 })
        unsubscribes.forEach(u => u())

        const t2Tweened = tweened(0)
        const t2 = t * n2 / n1

        unsubscribes = [
            t2Tweened.subscribe(t2 => {
                currentSystemRotation = n1
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

        appState = 'fall-done'
    }

    const onClickNew = () => {
        // loadPositionPx = loadBeginFallTopPx
        // disksRotation = 0
        loadFallingTime = 0
        disksRotationsDone = 0

        appState = 'idle'
    }

    const onInputVariantNumber = (e: any) => {
        const value = e.target.value as string

        if (!value) {
            variantNumber = null
            return
        }

        const num = parseInt(value)
        const valid = num >= 1 && num <= 30 && num % 1 === 0
        if (!valid) {
            variantNumber = null
            error = 'Некорректный номер варианта ' + num
            return
        }

        error = ''
        variantNumber = num
    }

    const onInputM = (e: any) => {
        const value = e.target.value as string

        if (!value) {
            m = null
            return
        }

        const num = parseFloat(value)
        const valid = num >= mRange[0] && num <= mRange[1]
        if (!valid) {
            error = 'Некорректная масса груза m = ' + num
            m = null
            return
        }

        error = ''
        m = num

        updatePhysicsTarget()
    }

    const onInputD = (e: any) => {
        const value = e.target.value as string

        if (!value) {
            d = null
            return
        }

        const num = parseFloat(value)
        const valid = num >= dRange[0] && num <= dRange[1]
        if (!valid) {
            d = null
            error = 'Некорректный диаметр шкива d = ' + num
            return
        }

        error = ''
        d = num

        updatePhysicsTarget()
    }

    const onInputN1 = (e: any) => {
        const value = e.target.value as string

        if (!value) {
            n1 = null as any
            return
        }

        const num = parseFloat(value)
        const valid = num >= n1Range[0] && num <= n1Range[1]
        if (!valid) {
            n1 = null as any
            error = 'Некорректное количество оборотов n1 = ' + num
            return
        }

        error = ''
        n1 = num

        updatePhysicsTarget()
    }

</script>

<div class="app" style="width: {width}px; height: {height}px; --scale: {$scale};">
    <div class="ui-holder to-left">
        <div class="ui">
            <h3 class="experiment-counter">
                Лабораторная работа №9
                <!--                Лабораторная работа №{ obj.aa }-->
            </h3>
            <section class="variant">
                <div class="section-element">
                    <div class="flex">
                        <span>Номер варианта</span>
                        <input type="number" max={30} min={1} placeholder="От 1 до 30"
                               on:input|preventDefault={onInputVariantNumber}/>
                    </div>
                </div>
            </section>
            <section class="input">
                <div class="section-element">
                    <div class="flex">
                        <span>m – Масса груза (кг)</span>
                        <input type="number" max={mRange[0]} min={mRange[1]} step=".1" placeholder="Введите m..."
                               on:input={onInputM}/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>d – Диаметр шкива (м)</span>
                        <input type="number" max={dRange[0]} min={dRange[1]} step=".05" placeholder="Введите d..."
                               on:input={onInputD}/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>n1 – Количество оборотов</span>
                        <input type="number" max="4" min="3" step="1" placeholder="Введите n1..." on:input={onInputN1}/>
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
            <section style="height: 3.5rem;">
                {#if error}
                    <div class="error-indicator">{error}</div>
                {/if}
                <!--                <div class="error-indicator">Масса должна быть в диапазоне [0.3; 1.0]</div>-->
            </section>
        </div>
    </div>

    <div class="physics-container" style="height: {containerHeightPx}px; width: {flywheelDiameterPx}px;">
        <div class="flywheel disk"
             style="width: {flywheelDiameterPx}px; transform: rotateZ({currentSystemRotation * 360}deg);"></div>
        <div class="pulley disk"
             style="width: {currentPulleyDiameterPx}px; top: {flywheelDiameterPx / 2 - currentPulleyDiameterPx / 2}px; left: {flywheelDiameterPx / 2 - currentPulleyDiameterPx / 2}px; transform: rotateZ({currentSystemRotation}deg);"></div>
        <div class="load"
             style="width: {currentLoadDiameterPx}px; height: {currentLoadDiameterPx}px; left: {threadLeftPx - currentLoadDiameterPx / 2}px; top: {currentLoadPositionPx}px;"></div>
        <div class="thread" style="height: {threadLengthPx}px; top: {threadTopPx}px; left: {threadLeftPx}px"></div>
    </div>
</div>

<style lang="scss">
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

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
                padding-bottom: 0;
                margin-bottom: 0;
                font-size: 1.5rem;
                color: white;
                text-align: center;
                font-weight: bold;
            }

            section {
                padding: 0 1rem;

                &.variant {
                    padding-top: 2rem;
                }

                &.input {
                    padding-top: 1.5rem;
                }

                &.output {
                    padding-top: 1.5rem;
                }

                .section-element {
                    backdrop-filter: brightness(10%);
                    background-clip: text;
                    padding: 1rem;

                    .flex {
                        display: flex;
                        align-items: baseline;
                        justify-content: space-between;
                        position: relative;

                        span {
                            color: white;
                            font-size: 1rem;
                            background-color: transparent;
                        }

                        input {
                            border: 0;
                            outline: 0;
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
                                outline: none !important;
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

                .error-indicator {
                    padding-top: 1rem;
                    padding-bottom: 1rem;
                    font-size: 16px;
                    color: #e72416;
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
