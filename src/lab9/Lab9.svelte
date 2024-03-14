<script lang="ts">
    import { quadInOut } from 'svelte/easing'
    import { tweened } from 'svelte/motion'
    import { height, scale, width } from '../lib/sizes'
    import {
        dRange,
        dRangePx,
        IRange,
        mRange,
        n1Range,
        n2Range,
        containerHeightPx,
        flywheelDiameterPx,
        loadDiameterRangePx,
        variantToI
    } from './const'

    let variantNumber: number | null
    let I: number
    $: I = variantToI[variantNumber ?? 1] ?? variantToI[1]

    let m: number | null = null
    let d: number | null = null
    let n1: number = null as any

    let t: number = null as any
    let n2: number = null as any

    $: {
        if (m && d && n1) {
            console.group()

            console.log(`m = ${m?.toFixed(2)}кг.`)
            console.log(`d = ${d?.toFixed(3)}м.`)
            console.log(`n1 = ${n1?.toFixed(1)}`)
            console.log(`I = ${I?.toFixed(3)}кг*м^2`)

            const frs = {
                m: (m - mRange[0]) / (mRange[1] - mRange[0]),
                d: 1 - (d - dRange[0]) / (dRange[1] - dRange[0]),
                n1: (n1 - n1Range[0]) / (n1Range[1] - n1Range[0]),
                I: (I - IRange[0]) / (IRange[1] - IRange[0])
            } as const

            const coefficients = {
                m: 2,
                d: 1,
                n1: 3,
                I: 2
            } as const

            const fr =
                Object.entries(coefficients)
                    .map(([ key, value ]) => value * frs[key as keyof typeof frs])
                    .reduce((acc, c) => acc + c, 0) /
                Object.values(coefficients).reduce((acc, c) => acc + c, 0)

            // 1 + n1/n2 = m d^2 t^2 g / 8HI
            // t = sqrt( (1 + n1/n2) * 8I * PI * d * n1 / (m * d^2 * g) )

            n2 = n2Range[0] + fr * fr * (n2Range[1] - n2Range[0])

            const H = Math.PI * d * n1

            t = Math.sqrt((1 + n1 / n2) * 8 * I * H / (m * d * d * 9.81))

            console.log(`n2 = ${n2.toFixed(2)}`)
            console.log(`t = ${t.toFixed(2)}сек.`)

            // n2 = n1 / ((m * d * d * t * t * 9.81 / (8 * H * I)) - 1)

            const studentI = m * (d ** 2) * (t ** 2) * 9.81 / (8 * H * (1 + n1 / n2))
            console.log(`studentI = ${studentI.toFixed(3)}кг*м^2`)

            console.groupEnd()
        }
    }

    let appState: 'idle' | 'targeting' | 'falling' | 'fall-done' = 'idle'
    let error: string = ''

    let canInput: boolean = false, canClickStart: boolean = false, canClickRaise: boolean = false
    $: canInput = (appState === 'idle' || appState === 'targeting')
    $: canClickStart = (appState === 'idle' || appState === 'targeting')
    $: canClickRaise = appState === 'fall-done'

    type PhysicsState = {
        pulleyDiameterPx: number
        systemRotation: number
        loadPositionPx: number
        loadDiameterPx: number
    }

    let physicsState: PhysicsState

    const physicsStateTweened = tweened<PhysicsState>(calculateTargetPhysicsState())
    physicsStateTweened.subscribe((currentState) => {
        if ((appState !== 'idle' && appState !== 'targeting') || !currentState) {
            return
        }

        physicsState = currentState
    })

    let threadTopPx: number = flywheelDiameterPx / 2
    let threadLeftPx: number
    let threadLengthPx: number
    $: threadLeftPx = flywheelDiameterPx / 2 + physicsState.pulleyDiameterPx / 2 - 2
    $: threadLengthPx = physicsState.loadPositionPx - flywheelDiameterPx / 2

    let loadFallingTime: number = 0
    let disksRotationsDone: number = 0
    let disksRotationDoneDisplayed: number
    $: disksRotationDoneDisplayed = Math.round(disksRotationsDone * 4) / 4

    function calculateTargetPhysicsState(): PhysicsState {
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
            systemRotation: Math.abs(physicsState.systemRotation - targetState.systemRotation),
            pulleyDiameterPx: Math.abs(physicsState.pulleyDiameterPx - targetState.pulleyDiameterPx),
            loadDiameterPx: Math.abs(physicsState.loadDiameterPx - targetState.loadDiameterPx),
            loadPositionPx: Math.abs(physicsState.loadPositionPx - targetState.loadPositionPx)
        }

        const frs: PhysicsState = {
            systemRotation: delta.systemRotation / (n1Range[1] - n1Range[0]),
            pulleyDiameterPx: delta.pulleyDiameterPx / (dRangePx[1] - dRangePx[0]),
            loadDiameterPx: delta.loadDiameterPx / (loadDiameterRangePx[1] - loadDiameterRangePx[0]),
            loadPositionPx: delta.loadPositionPx / (loadPositionRangePx[1] - loadPositionRangePx[0])
        }

        const coefficients: PhysicsState = {
            systemRotation: 1,
            pulleyDiameterPx: 1,
            loadDiameterPx: 1,
            loadPositionPx: 1
        }

        const fr =
            Object.entries(coefficients)
                .map(([ key, value ]) => value * frs[key as keyof PhysicsState])
                .reduce((acc, c) => acc + c, 0) /
            Object.values(coefficients).reduce((acc, c) => acc + c, 0)

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

        const loadEndFallTopPx = containerHeightPx - physicsState.loadDiameterPx
        const loadBeginFallTopPx = containerHeightPx - (physicsState.loadDiameterPx + n1 * physicsState.pulleyDiameterPx * Math.PI)

        const t1Tweened = tweened(0)
        const H = loadEndFallTopPx - loadBeginFallTopPx

        let unsubscribes = [
            t1Tweened.subscribe(t1 => loadFallingTime = t1),
            t1Tweened.subscribe(t1 => {
                physicsState.loadPositionPx = loadBeginFallTopPx + H * t1 * t1 / (t * t)
            }),
            t1Tweened.subscribe(t1 => {
                physicsState.systemRotation = n1 * t1 * t1 / (t * t)
            })
        ]

        await t1Tweened.set(t, { duration: t * 1000 })
        unsubscribes.forEach(u => u())

        const t2Tweened = tweened(0)
        const t2 = t * n2 / n1

        unsubscribes = [
            t2Tweened.subscribe(t2 => {
                physicsState.systemRotation = n1
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

    const onClickRaise = async () => {
        if (!canClickRaise) return

        appState = 'targeting'

        loadFallingTime = 0
        disksRotationsDone = 0

        await physicsStateTweened.set({
            loadPositionPx: physicsState.loadPositionPx,
            loadDiameterPx: physicsState.loadDiameterPx,
            pulleyDiameterPx: physicsState.pulleyDiameterPx,
            systemRotation: (n2 - n1) % 1
        }, { duration: 0 })
        await updatePhysicsTarget()

        appState = 'idle'
    }

    const onInputVariantNumber = (e: any) => {
        if (!canInput) return

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
        if (!canInput) return

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
        if (!canInput) return

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
        if (!canInput) return

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
    <div class="ui-holder">
        <div class="ui">
            <h3 class="ui-title">Лабораторная работа №9</h3>
            <section class="variant">
                <div class="section-element">
                    <div class="flex">
                        <span>Номер варианта</span>
                        <input disabled={!canInput} type="number" max={30} min={1} placeholder="от 1 до 30"
                               on:input|preventDefault={onInputVariantNumber}/>
                    </div>
                </div>
            </section>
            <section class="input">
                <div class="section-element">
                    <div class="flex">
                        <span>m – Масса груза (кг)</span>
                        <input disabled={!canInput} type="number" max={mRange[0]} min={mRange[1]} step=".1"
                               placeholder={`от ${mRange[0]} до ${mRange[1]}`}
                               on:input={onInputM}/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>d – Диаметр шкива (м)</span>
                        <input disabled={!canInput} type="number" max={dRange[0]} min={dRange[1]} step=".05"
                               placeholder={`от ${dRange[0]} до ${dRange[1]}`}
                               on:input={onInputD}/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <div class="flex">
                        <span>n1 – Количество оборотов</span>
                        <input disabled={!canInput} type="number" max="4" min="3" step="1"
                               placeholder={`от ${n1Range[0]} до ${n1Range[1]}`} on:input={onInputN1}/>
                    </div>
                </div>
                <div class="divider"></div>
                <div class="section-element">
                    <button disabled={!canClickStart} on:click={onClickStart}>Отпустить груз</button>
                </div>
                <div class="section-element" style="padding-top: 0; height: 3rem;">
                    <div class="error-indicator">{error}</div>
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
                    <button disabled={!canClickRaise} class="blue" on:click={onClickRaise}>Поднять груз</button>
                </div>
            </section>
        </div>
    </div>

    <div class="physics-container" style="height: {containerHeightPx}px; width: {flywheelDiameterPx}px;">
        <div class="flywheel disk"
             style="width: {flywheelDiameterPx}px; transform: rotateZ({physicsState.systemRotation * 360}deg);"></div>
        <div class="pulley disk"
             style="width: {physicsState.pulleyDiameterPx}px; top: {flywheelDiameterPx / 2 - physicsState.pulleyDiameterPx / 2}px; left: {flywheelDiameterPx / 2 - physicsState.pulleyDiameterPx / 2}px; transform: rotateZ({physicsState.systemRotation * 360}deg);"></div>
        <div class="load"
             style="width: {physicsState.loadDiameterPx}px; height: {physicsState.loadDiameterPx}px; left: {threadLeftPx - physicsState.loadDiameterPx / 2}px; top: {physicsState.loadPositionPx}px;"></div>
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
        left: 33%;
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
