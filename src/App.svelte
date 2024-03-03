<script lang="ts">
    import { tweened } from 'svelte/motion'
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
