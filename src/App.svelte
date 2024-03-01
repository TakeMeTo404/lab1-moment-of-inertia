<script lang="ts">
    import { onMount } from 'svelte'
    import { tweened } from 'svelte/motion'
    import { readable, writable, get, derived } from 'svelte/store'
    import { generateN2, generateT } from './calculations'
    import { mRange, dRange, dRangePx } from './const'
    import { width, height, scale } from './sizes'

    const containerHeightPx: number = 700
    const bigDiskDiameterPx: number = 200
    const loadDiameterPx = 80

    type State = 'idle' | 'falling' | 'fall-done'

    let state: State = 'idle'

    let m = .6
    let d = .07 // in meters
    let n1 = 3

    let t: number = 1
    let n2: number = 20
    $: t = generateT(m, d, n1)
    $: n2 = generateN2(m, d, n1)

    let smallDiskDiameterPx = dRangePx[0]
    $: {
        const fr = (d - dRange[0]) / (dRange[1] - dRange[0])
        smallDiskDiameterPx = dRangePx[0] + (dRangePx[1] - dRangePx[0]) * fr
    }

    let loadBeginFallTopPx = 0
    let loadEndFallTopPx = 0
    $: {
        loadEndFallTopPx = containerHeightPx - loadDiameterPx

        loadBeginFallTopPx = containerHeightPx - (loadDiameterPx + n1 * smallDiskDiameterPx * Math.PI)
    }

    let loadPositionPx: number
    $: {
        if (state === 'idle') {
            loadPositionPx = loadBeginFallTopPx
        }
    }

    let threadTopPx: number = bigDiskDiameterPx / 2
    let threadLeftPx: number
    let threadLengthPx: number
    $: threadLeftPx = bigDiskDiameterPx / 2 + smallDiskDiameterPx / 2
    $: threadLengthPx = loadPositionPx - bigDiskDiameterPx / 2

    let disksRotation = 0

    let loadFallingTime: number = 0
    let disksRotationsDone: number = 0
    let disksRotationDoneDisplayed: number
    $: disksRotationDoneDisplayed = Math.floor(disksRotationsDone * 4) / 4

    const onClickStart = async () => {
        state = 'falling'

        const loadEndSpeedPx = 2 * (loadEndFallTopPx - loadBeginFallTopPx) / t
        const circlesEndRotationSpeed = 2 * n1 / t

        const loadFallingSpeedPx = tweened(0)
        const disksRotationSpeed = tweened(0)

        let runRaf = true
        let listenTo = {
            loadFallingSpeed: true,
            disksRotationSpeed: true,
            fallingTime: true,
            disksRotationsDone: false
        }

        let lastUpdate = performance.now()
        requestAnimationFrame(function loop() {
            if (!runRaf) return

            const now = performance.now()
            const deltaSec = (now - lastUpdate) / 1000

            if (listenTo.loadFallingSpeed) loadPositionPx += get(loadFallingSpeedPx) * deltaSec
            if (listenTo.disksRotationSpeed) disksRotation += get(disksRotationSpeed) * deltaSec
            if (listenTo.fallingTime) loadFallingTime += deltaSec
            if (listenTo.disksRotationsDone) disksRotationsDone += get(disksRotationSpeed) * deltaSec

            lastUpdate = now

            requestAnimationFrame(loop)
        })

        await Promise.all([
            loadFallingSpeedPx.set(loadEndSpeedPx, { duration: t * 1000 }),
            disksRotationSpeed.set(circlesEndRotationSpeed, { duration: t * 1000 }),
        ])


        listenTo.fallingTime = false
        listenTo.loadFallingSpeed = false
        listenTo.disksRotationsDone = true

        const timeOfCirclesRotating = 2 * n2 / circlesEndRotationSpeed

        await Promise.all([
            disksRotationSpeed.set(0, { duration: timeOfCirclesRotating * 1000 }),
        ])

        runRaf = false

        state = 'fall-done'
    }

    const onClickNew = () => {
        loadPositionPx = loadBeginFallTopPx
        disksRotation = 0
        loadFallingTime = 0
        disksRotationsDone = 0

        /*loadFallingSpeedPx.set(0, { duration: 0 })
        disksRotationSpeed.set(0, { duration: 0 })
        fallingTimePassed.set(0, { duration: 0 })
        disksRotationsDone*/

        state = 'idle'
    }

    $: console.log(`Масса груза(г) = ${m}`)
    $: console.log(`Диаметр шкива(м) = ${d}`)
    $: console.log(`Количество оборотов n1 = ${n1}`)
    $: console.log(`Время (с.) = ${t}`)
    $: console.log(`Количество оборотов n2 = ${n2}`)
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

        <div class="row"><button disabled={state !== 'idle'} on:click|preventDefault|stopPropagation={onClickStart}>Начать эксперимент</button></div>
        <div class="row"><button disabled={state !== 'fall-done'} on:click|preventDefault|stopPropagation={onClickNew}>Новый эксперимент</button></div>
        {#if state === 'falling' || state === 'fall-done'}
            <div class="row">
                <span>Время падения: {loadFallingTime.toFixed(1)}сек.</span>
            </div>
            <div class="row">
                <span>Сделано оборотов: {disksRotationDoneDisplayed.toFixed(2)}</span>
            </div>
        {/if}
    </div>

    <div class="physics-container" style="height: {containerHeightPx}px; width: {bigDiskDiameterPx}px;">
        <div class="big-disk disk"
             style="width: {bigDiskDiameterPx}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="small-disk disk"
             style="width: {smallDiskDiameterPx}px; top: {bigDiskDiameterPx / 2 - smallDiskDiameterPx / 2}px; left: {bigDiskDiameterPx / 2 - smallDiskDiameterPx / 2}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="load"
             style="width: {loadDiameterPx}px; height: {loadDiameterPx}px; left: {(bigDiskDiameterPx + smallDiskDiameterPx - loadDiameterPx) / 2}px; top: {loadPositionPx}px;"></div>
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
        //background-image: url("./assets/bg.jpeg");
        background-size: cover;
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
        left: 450px;
        bottom: 50px;

        border: 2px solid red;

        .disk {
            position: absolute;
            aspect-ratio: 1;

            background-size: contain;
            background-position: center center;
            transform-origin: center center;
            background-repeat: no-repeat;
        }

        .big-disk {
            left: 0;
            top: 0;
            background-image: url("./assets/big-disk.png");
        }

        .small-disk {
            background-image: url("./assets/small-disk.png");
        }

        .load {
            position: absolute;

            aspect-ratio: 1;
            background-image: url("./assets/load.png");
            background-position: center center;
            background-size: contain;
            background-repeat: no-repeat;
            border: 2px solid blue;
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
