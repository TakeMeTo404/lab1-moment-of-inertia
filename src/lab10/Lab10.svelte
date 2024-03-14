<script lang="ts">
    import { pipe } from 'lodash/fp'
    import { height, scale, width } from '../lib/sizes'


</script>

<div class="app" style="width: {width}px; height: {height}px; scale: {$scale};">

</div>

<style>
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .app {
        position: fixed;
        top: 50%;
        left: 50%;
        translate: -50% -50%;
        border: 1px solid black;
        background-size: contain;
        background-repeat: no-repeat;
        background: red;
    }


</style>