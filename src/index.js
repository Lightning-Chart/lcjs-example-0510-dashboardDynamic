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

const lcjs = require('@arction/lcjs')
const xydata = require('@arction/xydata')
const { lightningChart, emptyLine, translatePoint, Themes } = lcjs
const { createProgressiveTraceGenerator } = xydata

const exampleContainer = document.getElementById('chart') || document.body

const mainDiv = document.createElement('div')
exampleContainer.append(mainDiv)
mainDiv.style.position = 'absolute'
mainDiv.style.width = '14.5%'
mainDiv.style.height = 'auto'
mainDiv.style.display = 'flex'
mainDiv.style.justifyContent = 'center'
mainDiv.style.flexDirection = 'row'
mainDiv.style.color = 'black'
mainDiv.style.zIndex = '1'

const uiDiv = document.createElement('div')
mainDiv.append(uiDiv)
uiDiv.style.display = 'flex'
uiDiv.style.flexDirection = 'column'
uiDiv.style.backgroundColor = 'transparent'
uiDiv.style.color = exampleContainer.parentElement && window.getComputedStyle(exampleContainer.parentElement).color

const uiDivTitle = document.createElement('span')
uiDiv.append(uiDivTitle)
uiDivTitle.innerHTML = 'Click to add graph'

// NOTE: When this is exceeded dashboard would have to be recreated again with all charts and data.
// There is no existing identified limit for this value though.
const maxCellsCount = 5

const dashboard = lightningChart()
    .Dashboard({
        numberOfColumns: 2,
        numberOfRows: maxCellsCount,
        // theme: Themes.darkGold
    })
    .setSplitterStyle(emptyLine)
    .setColumnWidth(0, 1)
    .setColumnWidth(1, 6)

const charts = []

const updateDashboardRowHeights = () => {
    for (let row = 0; row < maxCellsCount; row += 1) {
        dashboard.setRowHeight(row, 0.00001)
    }
    charts.forEach((chart) => dashboard.setRowHeight(chart.row, 1))
}

const addGraph = (name, data) => {
    const freeRow = new Array(maxCellsCount).fill(0).findIndex((_, row) => charts.find((item) => item.row === row) === undefined)
    if (freeRow < 0) {
        // Dashboard has no more row slots.
        alert(`Dashboard is not allocated for more than ${maxCellsCount} graphs`)
        return
    }

    const chart = dashboard
        .createChartXY({
            columnIndex: 1,
            columnSpan: 1,
            rowIndex: freeRow,
        })
        .setTitle(name)
        .setTitleFont((font) => font.setSize(12))
        .setTitleMargin({ top: 0, bottom: 0 })
        .setPadding({ top: 0 })

    const buttonRemoveChart = document.createElement('button')
    document.body.append(buttonRemoveChart)
    buttonRemoveChart.innerHTML = 'X'
    buttonRemoveChart.style.position = 'absolute'
    buttonRemoveChart.style.zIndex = '1'

    buttonRemoveChart.addEventListener('click', (e) => {
        chart.dispose()
        document.body.removeChild(buttonRemoveChart)
        charts.splice(
            charts.findIndex((item) => item.chart === chart),
            1,
        )
        updateDashboardRowHeights()
        charts.forEach((item) => item.updateRemoveButtonPosition())
    })

    const updateRemoveButtonPosition = () => {
        const posChartEngine = translatePoint({ x: 100, y: 100 }, chart.uiScale, chart.engine.scale)
        const posChart = chart.engine.engineLocation2Client(posChartEngine.x, posChartEngine.y)
        buttonRemoveChart.style.left = `${posChart.x - buttonRemoveChart.offsetWidth}px`
        buttonRemoveChart.style.top = `${posChart.y}px`
    }

    const series = chart
        .addPointLineSeries({
            dataPattern: { pattern: 'ProgressiveX' },
        })
        .setName(name)
        .add(data)

    charts.push({
        row: freeRow,
        chart,
        updateRemoveButtonPosition,
    })
    updateDashboardRowHeights()
    charts.forEach((item) => item.updateRemoveButtonPosition())
}

;(async () => {
    for (let i = 0; i < 6; i += 1) {
        const label = `Measurement ${new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}`
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

window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
        charts.forEach((item) => item.updateRemoveButtonPosition())
    })
})
