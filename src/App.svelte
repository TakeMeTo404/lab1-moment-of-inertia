<script lang="ts">
    import { onMount } from 'svelte'
    import { tweened } from 'svelte/motion'
    import { readable, writable, get } from 'svelte/store'
    import { width, height, scale } from './sizes'

    const containerHeightPx: number = 700
    const bigDiskDiameterPx: number = 200
    const smallDiskDiameterPx = 40
    const loadDiameterPx = 80

    const g = 9.81
    let m = .6
    let d = .07 // in meters
    let n1 = 1

    let n2 = 20
    let t = 4 // in seconds

    let H = n1 * 2 * Math.PI * d // in meters

    let loadPositionPx = containerHeightPx - (loadDiameterPx + n1 * smallDiskDiameterPx * Math.PI)
    const loadFallingSpeedPx = tweened(0)

    let disksRotation = 0
    const disksRotationSpeed = tweened(0)

    onMount(async function loadFalling() {

        const loadBeginTopPx = containerHeightPx - (loadDiameterPx + n1 * smallDiskDiameterPx * Math.PI)
        const loadEndTopPx = containerHeightPx - loadDiameterPx

        const loadBeginSpeedPx = 0
        const loadEndSpeedPx = 2 * (loadEndTopPx - loadBeginTopPx) / t

        const circlesBeginRotationSpeed = 0
        const circlesEndRotationSpeed = 2 * n1 / t

        await Promise.all([
            loadFallingSpeedPx.set((loadEndSpeedPx - loadBeginSpeedPx), { duration: t * 1000 }),
            disksRotationSpeed.set((circlesEndRotationSpeed - circlesBeginRotationSpeed), { duration: t * 1000 })
        ])

        loadFallingSpeedPx.set(0, { duration: 0 })

        const timeOfCirclesRotating = 2 * n2 / circlesEndRotationSpeed

        await disksRotationSpeed.set(0, { duration: timeOfCirclesRotating * 1000 })
    })

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
</script>

<div class="app" style="width: {width}px; height: {height}px; --scale: {$scale};">
    <!--    <div class="toolbar">-->
    <!--        <input bind:value={m} placeholder="Масса груза(г)...">-->
    <!--        <input bind:value={d} placeholder="Диаметр диска...">-->
    <!--        <input bind:value={n1} placeholder="Количество оборотов...">-->
    <!--    </div>-->

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
        background-size: cover;
    }

    .toolbar {
        position: absolute;
        left: 10%;
        top: 50%;
        transform: translateY(-50%);

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
