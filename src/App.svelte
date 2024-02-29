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
    const loadFallingSpeedPx = tweened(0)

    $: {
        if (state === 'idle') {
            loadPositionPx = loadBeginFallTopPx
        }
    }

    let disksRotation = 0
    const disksRotationSpeed = tweened(0)

    const fallingTimePassed = tweened(0)
    const disksRotationsDone = tweened(0)

    onMount(function listenToSpeeds() {
        let lastUpdate = performance.now()

        function loop() {
            const now = performance.now()
            const deltaSec = (now - lastUpdate) / 1000

            loadPositionPx += get(loadFallingSpeedPx) * deltaSec
            disksRotation += get(disksRotationSpeed) * deltaSec

            lastUpdate = now

            requestAnimationFrame(loop)
        }

        loop()
    })

    const onClickStart = async () => {
        state = 'falling'

        loadPositionPx = loadBeginFallTopPx
        disksRotation = 0
        loadFallingSpeedPx.set(0, { duration: 0 })
        disksRotationSpeed.set(0, { duration: 0 })
        fallingTimePassed.set(0, { duration: 0 })
        disksRotationsDone.set(0, { duration: 0 })

        const loadEndSpeedPx = 2 * (loadEndFallTopPx - loadBeginFallTopPx) / t

        const circlesEndRotationSpeed = 2 * n1 / t

        await Promise.all([
            loadFallingSpeedPx.set(loadEndSpeedPx, { duration: t * 1000 }),
            disksRotationSpeed.set(circlesEndRotationSpeed, { duration: t * 1000 }),
            fallingTimePassed.set(t, { duration: t * 1000 })
        ])

        loadFallingSpeedPx.set(0, { duration: 0 })

        const timeOfCirclesRotating = 2 * n2 / circlesEndRotationSpeed

        await Promise.all([
            disksRotationSpeed.set(0, { duration: timeOfCirclesRotating * 1000 }),
            disksRotationsDone.set(n2, { duration: timeOfCirclesRotating * 1000 })
        ])

        state = 'fall-done'
    }

    const onClickNew = () => {


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
        <input bind:value={m} disabled={state !== 'idle'} type="number" min={mRange[0]} max={mRange[1]} step=".1" placeholder="Масса груза(г)...">
        <input bind:value={d} disabled={state !== 'idle'} type="number" min={dRange[0]} max={dRange[1]} step=".01" placeholder="Диаметр шкива(м)...">
        <input bind:value={n1} disabled={state !== 'idle'} type="number" min="3" max="4" step="1" placeholder="Количество оборотов...">
        <button disabled={state !== 'idle'} on:click|preventDefault|stopPropagation={onClickStart}>Начать эксперимент</button>
        <button disabled={state !== 'fall-done'} on:click|preventDefault|stopPropagation={onClickNew}>Новый эксперимент</button>
        {#if state === 'falling' || state === 'fall-done'}
            <span>Время падения груза: {$fallingTimePassed.toFixed(2)}сек.</span>
            <span>Сделано оборотов: {$disksRotationsDone.toFixed(1)}</span>
        {/if}
    </div>

    <div class="physics-container" style="height: {containerHeightPx}px; width: {bigDiskDiameterPx}px;">
        <div class="big-disk disk"
             style="width: {bigDiskDiameterPx}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="small-disk disk"
             style="width: {smallDiskDiameterPx}px; top: {bigDiskDiameterPx / 2 - smallDiskDiameterPx / 2}px; left: {bigDiskDiameterPx / 2 - smallDiskDiameterPx / 2}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="load"
             style="width: {loadDiameterPx}px; height: {loadDiameterPx}px; left: {(bigDiskDiameterPx + smallDiskDiameterPx - loadDiameterPx) / 2}px; top: {loadPositionPx}px;"></div>
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

        width: 200px;
        display: flex;
        flex-direction: column;
        gap: 20px;
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
    }
</style>
