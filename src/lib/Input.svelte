<script lang="ts" context="module">

</script>

<script lang="ts">
    import type { Range } from './range-util'
    import type { Snippet } from 'svelte';
    import { inRange } from './range-util'

    type Props = {
        value: number,
        readonly: boolean,

        title: string,
        
        range: Range,
        valid: boolean,

        inputSnippet: Snippet<[{ value: number }]>
    }

    let { 
        value = $bindable(),
        readonly,

        title,

        range,
        valid = $bindable(),

        inputSnippet
     }: Props = $props()


</script>

{#if inputSnippet}
    {@render inputSnippet({ 
        get value() { return value }, 
        set value(v) { v = value } 
    })}
{:else}
    <span class:red={valid}>{title}</span>
    <input
        bind:value={value}
    />
{/if}


<!-- {#snippet defaultInput()}
    <span class:red={p.input.displayedError}>{p.input.title}</span>
    <input
    bind:value={p.input.value}
    placeholder={p.input.placeholder}
    type="number"
    class="text-field"
    />  
    {#if p.input.displayedError}
    <span class="error red">{ p.input.displayedError }</span>
    {/if}
{/snippet}

{ @render inputSnippet()} -->