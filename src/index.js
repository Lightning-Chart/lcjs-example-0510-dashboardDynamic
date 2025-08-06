/**
 * Example on how a dynamic chart dashboard can be created with LightningChart JS.
 *
 * The use case is an application where charts can be added and removed at users whim to perform different kinds of analysis within a dynamic application setting.
 *
 * This can be achieved out of the box with LightningChart by placing each chart in its own HTML DIV,
 * but this performs slightly worse than if the charts would be inside a Dashboard component.
 *
 * By using a Dashboard, the rendering engine for all Charts can be reused leading to much more faster redrawing and most importantly initial loading speed.
 *
 * Generally, LC JS Dashboards are static sized (for example, 2x2 grid) and size can't be changed afterwards.
 * However, with some creative coding this limitation can be worked around by preallocating the Dashboard for some number of "maximum charts"
 * and then programmatically resizing the Dashboard cells which actually have charts in them.
 */

const lcjs = require('@lightningchart/lcjs')
const xydata = require('@lightningchart/xydata')
const { lightningChart, emptyFill, Themes } = lcjs
const { createProgressiveTraceGenerator } = xydata

const exampleContainer = document.getElementById('chart') || document.body
if (exampleContainer === document.body) {
    document.body.style.width = '100vw'
    document.body.style.height = '100vh'
    document.body.style.margin = '0px'
}
const layoutCharts = document.createElement('div')
exampleContainer.append(layoutCharts)
layoutCharts.style.position = 'absolute'
layoutCharts.style.width = '100%'
layoutCharts.style.minHeight = '100%'
layoutCharts.style.display = 'flex'
layoutCharts.style.flexDirection = 'column'

const uiDiv = document.createElement('div')
exampleContainer.append(uiDiv)
uiDiv.style.position = 'fixed'
uiDiv.style.width = '100px'
uiDiv.style.display = 'flex'
uiDiv.style.flexDirection = 'column'
uiDiv.style.backgroundColor = 'transparent'
uiDiv.style.color = exampleContainer.parentElement && window.getComputedStyle(exampleContainer.parentElement).color
uiDiv.style.zIndex = '100'

const uiDivTitle = document.createElement('span')
uiDiv.append(uiDivTitle)
uiDivTitle.innerHTML = 'Click to add graph'

const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
const charts = []

const addGraph = (name, data) => {
    const container = document.createElement('div')
    layoutCharts.append(container)
    const chart = lc
        .ChartXY({
            container,
            legend: { visible: false },
            theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
        })
        .setTitle('')
        .setPadding({ top: 0, left: 100 })

    const axisX = chart.getDefaultAxisX()
    const axisY = chart.getDefaultAxisY().setThickness({ min: 80 })

    const buttonRemoveChart = document.createElement('button')
    container.append(buttonRemoveChart)
    buttonRemoveChart.innerHTML = 'X'
    buttonRemoveChart.style.position = 'absolute'
    buttonRemoveChart.style.right = '0px'
    buttonRemoveChart.style.top = '0px'
    buttonRemoveChart.style.zIndex = '1'

    buttonRemoveChart.onclick = (e) => {
        chart.dispose()
        container.remove()

        charts.splice(
            charts.findIndex((item) => item.chart === chart),
            1,
        )
        buttonRemoveChart.onclick = undefined
        changeCharts()
    }

    const series = chart.addLineSeries().setName(name).appendJSON(data)

    charts.push({
        chart,
        container,
    })
    changeCharts()
    container.scrollTo()

    function changeCharts() {
        const parentHeight = exampleContainer.getBoundingClientRect().height
        const numberOfCharts = charts.length
        const divHeight = parentHeight / numberOfCharts + 'px'
        container.style.height = divHeight
        charts.forEach(({ chart, container }) => {
            container.style.height = divHeight
        })
    }
}

;(async () => {
    for (let i = 0; i < 20; i += 1) {
        const label = `${new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}`
        const data = await createProgressiveTraceGenerator().setNumberOfPoints(200).generate().toPromise()

        const buttonAddChart = document.createElement('button')
        uiDiv.append(buttonAddChart)
        buttonAddChart.innerHTML = label
        buttonAddChart.style.margin = '4px 0'
        buttonAddChart.addEventListener('click', (e) => {
            addGraph(label, data)
        })
        if (i < 3) addGraph(label, data)
    }
})()
