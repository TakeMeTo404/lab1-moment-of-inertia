import './app.scss'
// import App from './lab9/Lab9.svelte'
import App from './lab10/Lab10.svelte'
import { mount } from 'svelte'

const app = mount(App, { target: document.body })

export default app
