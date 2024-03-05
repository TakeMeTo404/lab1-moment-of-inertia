<script lang="ts">
    import { tweened } from 'svelte/motion'
    import { mRange, dRange, dRangePx, containerHeightPx, flywheelDiameterPx, loadDiameterPx } from './const'
    import { width, height, scale } from './sizes'

    type State = 'idle' | 'falling' | 'fall-done'

    let state: State = 'idle'

    /*let m = .6
    let d = .065
    let n1 = 3
    const I = .204
    const g = 9.81

    let t: number
    let n2: number
    $: {
        console.group()
        console.log(`m = ${m.toFixed(2)}кг.`)
        console.log(`d = ${d.toFixed(2)}м.`)
        console.log(`n1 = ${n1.toFixed(1)}`)
        console.log(`I = ${I.toFixed(2)}кг*м^2`)

        /!* e = mg / (2m pi R^2 + I/R) *!/
        const e = m * g / (2 * m * Math.PI * (d * d / 4) + 2 * I / d)
        const t2 = Math.sqrt(2 * n1 / e)
        // console.log(`t2 = ${t2.toFixed(2)}сек.`)

        const a =
            m * g /
            (m + (
                I / (2 * Math.PI * (d * d / 4))
            ))

        const H = Math.PI * d * n1
        console.log(`H = ${H}м.`)

        t = Math.sqrt(2 * H / a)
        console.log(`t = ${t.toFixed(2)}сек.`)
        n2 = n1 /
            (
                (m * d * d * t * t * g) / (8 * H * I)
                - 1
            )

        const checkI = m * d**2 * t**2 * g / (8 * H * (1 + n1/n2))
        const checkI2 = m * d * t**2 * g * n2 / (8 * n1 * Math.PI * (n1 + n2))
        // console.log(`I=${I.toFixed(2)}, checkI=${checkI.toFixed(2)},, checkI2=${checkI2.toFixed(2)}`)

        console.log(`n2 = ${n2.toFixed(1)}`)
        console.groupEnd()
    }*/

    /*let ff: number = 0
    $: console.log(ff, ff, ff, ff)*/

    let m = 0.6
    let d = 0.065
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
    /*
        $: console.log(`Масса груза(г) = ${m}`)
        $: console.log(`Диаметр шкива(м) = ${d}`)
        $: console.log(`Количество оборотов n1 = ${n1}`)
        $: console.log(`Время (с.) = ${t}`)
        $: console.log(`Количество оборотов n2 = ${n2}`)*/
</script>

<div class="app" style="width: {width}px; height: {height}px; --scale: {$scale};">
    <div class="toolbar">
        <div class="row">
            <span>Масса груза (кг.)</span>
            <input bind:value={m} disabled={state !== 'idle'} type="number" min={mRange[0]} max={mRange[1]} step=".1">
        </div>
        <div class="row">
            <span>Диаметр шкива(м)</span>
            <input bind:value={d} disabled={state !== 'idle'} type="number" min={dRange[0]} max={dRange[1]} step=".01">
        </div>
        <div class="row">
            <span>Количество оборотов</span>
            <input bind:value={n1} disabled={state !== 'idle'} type="number" min="3" max="4" step="1">
        </div>

        <div class="row">
            <button disabled={state !== 'idle'} on:click|preventDefault|stopPropagation={onClickStart}>
                Начать эксперимент
            </button>
        </div>
        <div class="row">
            <button disabled={state !== 'fall-done'} on:click|preventDefault|stopPropagation={onClickNew}>
                Новый эксперимент
            </button>
        </div>
        {#if state === 'falling' || state === 'fall-done'}
            <div class="row">
                <span>Время падения: {loadFallingTime.toFixed(1)}сек.</span>
            </div>
            <div class="row">
                <span>Сделано оборотов: {disksRotationDoneDisplayed.toFixed(2)}</span>
            </div>
        {/if}
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

    .toolbar {
        position: absolute;
        left: 10%;
        top: 50%;
        transform: translateY(-50%);

        .row {
            display: flex;
            justify-content: space-between;
        }
    }

    .physics-container {
        position: absolute;
        left: 650px;
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
