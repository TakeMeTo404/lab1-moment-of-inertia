<script lang="ts">
    import { onMount } from 'svelte'
    import { tweened } from 'svelte/motion'
    import { readable, writable, get } from 'svelte/store'
    import { width, height, scale} from './sizes'

    const containerHeightPx: number = 700
    const bigDiskDiameterPx: number = 300
    const smallDiskDiameterPx = 70
    const loadDiameterPx = 80

    const smallDiskPositionY = bigDiskDiameterPx / 2 - smallDiskDiameterPx / 2

    let loadPositionPx = bigDiskDiameterPx / 2
    const loadFallingSpeedPx = tweened(0)

    let disksRotation = 0
    const disksRotationSpeed = tweened(0)

    const g = 9.81
    let m = .6
    let d = .07 // in meters
    let n1 = 4

    let n2 = 20
    let t = 4 // in seconds

    let H = n1 * 2 * Math.PI * d // in meters

    let bigDiskElement
    let smallDiskElement

    onMount(async function loadFalling() {

        const loadBeginTopPx = bigDiskDiameterPx / 2
        const loadEndTopPx = containerHeightPx - loadDiameterPx

        const loadBeginSpeed = 0
        const loadEndSpeed = 2 * H / t

        const loadBeginSpeedPx = 0
        const loadEndSpeedPx = 2 * (loadEndTopPx - loadBeginTopPx) / t

        const circlesBeginRotation = 0
        const circlesEndRotation = n1

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

            // console.log(deltaSec)

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
        <div class="big-disk disk" bind:this={bigDiskElement}
             style="width: {bigDiskDiameterPx}px; transform: rotateZ({disksRotation * 360}deg);"></div>
        <div class="small-disk disk" bind:this={smallDiskElement}
             style="width: {smallDiskDiameterPx}px; top: {smallDiskPositionY}px; left: {smallDiskPositionY}px; transform: rotateZ({disksRotation * 360}deg);"></div>
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
        background-image: url("./assets/bg.jpeg");
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
            //width: $big-disk-diameter;

            background-image: url("./assets/big-disk.png");
        }

        .small-disk {
            //top: calc($big-disk-diameter / 2 - $small-disk-diameter / 2);
            //left: calc($big-disk-diameter / 2 - $small-disk-diameter / 2);
            //width: $small-disk-diameter;

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
