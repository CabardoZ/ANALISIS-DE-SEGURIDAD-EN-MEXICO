am4core.ready(function () {

  am4core.useTheme(am4themes_animated);

  // =========================
  // VARIABLES GLOBALES
  // =========================
  var mapChart;
  var polygonSeries;
  var chartXY;
  var pieChart;
  var pieSeries;
  var barChart;
  var treemapChart;
  var treemapSeries;


  var currentYear = 2022;
  var currentCrime = "homicidio";
  var currentState = null; // null = nacional

  var monthlyRawData = [];
  var currentMonthYear = currentYear;
  var currentMonthEntity = null; // null = nacional

  var radarFederalChart;
  var radarFederalRawData = [];
  var currentFederalYear = currentYear;
  var currentFederalEntity = null;

  var sexoRawData = [];
  var monthlyChart; 


  // =========================
  // MAPA
  // =========================
  mapChart = am4core.create("map", am4maps.MapChart);
  mapChart.geodata = am4geodata_mexicoLow;
  mapChart.projection = new am4maps.projections.Miller();

  // Fondo oscuro ejecutivo
  mapChart.background.fill = am4core.color("#121917");
  mapChart.background.fillOpacity = 1;

  mapChart.seriesContainer.draggable = false;
  mapChart.seriesContainer.resizable = false;
  mapChart.maxZoomLevel = 1;

  polygonSeries = mapChart.series.push(new am4maps.MapPolygonSeries());
  polygonSeries.useGeodata = true;
  polygonSeries.dataFields.id = "id";
  polygonSeries.dataFields.value = "value";

  polygonSeries.heatRules.push({
    property: "fill",
    target: polygonSeries.mapPolygons.template,
    min: am4core.color("#1b5e20"),
    max: am4core.color("#a5d6a7")
  });

  var polygonTemplate = polygonSeries.mapPolygons.template;
  polygonTemplate.tooltipText = "{name}: {value}";
  polygonTemplate.stroke = am4core.color("#0f1412");
  polygonTemplate.strokeWidth = 0.5;

  function loadMapData(year, crime) {
    fetch(`data/estados_${year}_${crime}.json`)
      .then(r => r.ok ? r.json() : [])
      .then(d => polygonSeries.data = d)
      .catch(() => polygonSeries.data = []);
  }

  loadMapData(currentYear, currentCrime);

  // =========================
  // GRÁFICA DE TENDENCIA
  // =========================
  chartXY = am4core.create("chart", am4charts.XYChart);

  // TÍTULO
var chartXYTitle = chartXY.titles.create();
chartXYTitle.text =
  "Tendencia nacional y por entidad federativa en índice de delitos del fuero estatal (2015–2025)";
chartXYTitle.fontSize = 14;
chartXYTitle.fontWeight = "600";
chartXYTitle.fill = am4core.color("#c8e6c9");

chartXYTitle.marginBottom = 16;   // 
chartXY.paddingTop = 14 ;  

  chartXY.background.fill = am4core.color("#121917");
  chartXY.background.fillOpacity = 1;
  chartXY.numberFormatter.numberFormat = "#";

  var categoryAxis = chartXY.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "year";
  categoryAxis.title.text = "Año";
  categoryAxis.renderer.labels.template.fill = am4core.color("#c8e6c9");
  categoryAxis.renderer.grid.template.strokeOpacity = 0.1;

  categoryAxis.renderer.labels.template.adapter.add("text", function (t) {
    return t ? String(t).replace(/,/g, "") : "";
  });

  var valueAxis = chartXY.yAxes.push(new am4charts.ValueAxis());
  valueAxis.title.text = "Delitos";
  valueAxis.renderer.labels.template.fill = am4core.color("#c8e6c9");
  valueAxis.renderer.grid.template.strokeOpacity = 0.1;

  var series = chartXY.series.push(new am4charts.LineSeries());
  series.dataFields.categoryX = "year";
  series.dataFields.valueY = "value";
  series.strokeWidth = 2;
  series.tooltipText = "{valueY}";
  series.stroke = am4core.color("#66bb6a");

  var bullet = series.bullets.push(new am4charts.CircleBullet());
  bullet.circle.fill = am4core.color("#66bb6a");

  chartXY.cursor = new am4charts.XYCursor();

  function loadChartData(crime, state = null) {
    const url = state === null
      ? `data/nacional_${crime}.json`
      : `data/estatal_${crime}_${state}.json`;

    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(d => chartXY.data = d)
      .catch(() => chartXY.data = []);
  }

  loadChartData(currentCrime);


  // =========================
  // GRÁFICO DE PASTEL
  // =========================
  pieChart = am4core.create("pieChart", am4charts.PieChart);
  pieChart.paddingTop = -2;
  pieChart.paddingBottom = 0;

  // TÍTULO
// TÍTULO DEL GRÁFICO DE PASTEL
let pieTitle = pieChart.titles.create();
pieTitle.text = "Distribución de delitos del fuero estatal por entidad federativa";
pieTitle.fontSize = 14;
pieTitle.marginBottom = 16;
pieTitle.fill = am4core.color("#c8e6c9");
pieTitle.align = "center";

  pieChart.innerRadius = am4core.percent(40);

  pieChart.background.fill = am4core.color("#121917");
  pieChart.background.fillOpacity = 1;

  pieSeries = pieChart.series.push(new am4charts.PieSeries());
  pieSeries.dataFields.value = "value";
  pieSeries.dataFields.category = "delito";
  pieSeries.slices.template.tooltipText = "{category}: {value}";

  pieSeries.labels.template.fill = am4core.color("#e8f5e9");
  pieSeries.ticks.template.stroke = am4core.color("#a5d6a7");

  pieSeries.colors.list = [
    am4core.color("#1b5e20"),
    am4core.color("#2e7d32"),
    am4core.color("#388e3c"),
    am4core.color("#43a047"),
    am4core.color("#66bb6a"),
    am4core.color("#81c784"),
    am4core.color("#a5d6a7")
  ];

  function loadPieData(year, state = null) {
    let url = state === null
      ? `data/total_por_delito_${year}.json`
      : `data/pastel_estatal_${year}_${state}.json`;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          console.warn("No existe JSON:", url);
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (!data || data.length === 0) {
          pieChart.data = [];
          pieChart.invalidateData();
          return;
        }

        data.sort((a, b) => b.value - a.value);
        pieChart.data = data;
      })
      .catch(() => pieChart.data = []);
  }

  loadPieData(currentYear, null);


 // =========================
// GRÁFICO DE BARRAS · VÍCTIMAS POR ENTIDAD
// =========================
var barChart = am4core.create("barChart", am4charts.XYChart);
barChart.topAxesContainer.paddingTop = 0;
barChart.bottomAxesContainer.paddingBottom = 0;
barChart.plotContainer.paddingTop = 0;
var barTitle = barChart.titles.create();
barTitle.text = "Número de víctimas de delitos por entidad federativa y por año (2015–2025)";
barTitle.fontSize = 15;
barTitle.fontWeight = "600";
barTitle.fill = am4core.color("#a5d6a7");

/* 🔑 AQUÍ ESTÁ LA CLAVE */
barTitle.marginBottom = 2;
barTitle.paddingBottom = 0;
barTitle.dy = 0;
barChart.plotContainer.paddingTop = 0;
barChart.topAxesContainer.paddingTop = 0;
barChart.bottomAxesContainer.paddingBottom = 0;

barChart.background.fill = am4core.color("#121917");
barChart.background.fillOpacity = 1;
barChart.paddingTop = 4;      // 🔥 antes 20
barChart.paddingBottom = 12;
barChart.paddingLeft = 20;
barChart.paddingRight = 20;


// EJE CATEGORÍAS (ENTIDADES)
var categoryAxisBar = barChart.yAxes.push(new am4charts.CategoryAxis());
categoryAxisBar.dataFields.category = "entity";
categoryAxisBar.renderer.labels.template.fill = am4core.color("#c8e6c9");
categoryAxisBar.renderer.inversed = true;
categoryAxisBar.renderer.grid.template.strokeOpacity = 0.1;

barChart.cursor = new am4charts.XYCursor();
barChart.cursor.behavior = "none";
barChart.cursor.lineY.disabled = true;
barChart.cursor.lineX.disabled = true;

categoryAxisBar.renderer.labels.template.truncate = true;
categoryAxisBar.renderer.labels.template.maxWidth = 180;

/* 🔥 CLAVES */
categoryAxisBar.renderer.minGridDistance = 1;
categoryAxisBar.renderer.cellStartLocation = 0.05;
categoryAxisBar.renderer.cellEndLocation = 0.95;

// SCROLL
barChart.scrollbarY = new am4core.Scrollbar();
barChart.scrollbarY.marginTop = 0;
barChart.scrollbarY.marginBottom = 0;

barChart.plotContainer.dy = -8;



// EJE VALORES (VÍCTIMAS)
var valueAxisBar = barChart.xAxes.push(new am4charts.ValueAxis());
valueAxisBar.renderer.labels.template.fill = am4core.color("#c8e6c9");
valueAxisBar.renderer.grid.template.strokeOpacity = 0.1;

// SERIE DE BARRAS
var barSeries = barChart.series.push(new am4charts.ColumnSeries());
barSeries.dataFields.categoryY = "entity";
barSeries.dataFields.valueX = "value";
barSeries.yAxis = categoryAxisBar;   
barSeries.xAxis = valueAxisBar;  
barSeries.tooltipText = "{valueX.formatNumber('#,###')}";
barSeries.columns.template.fill = am4core.color("#66bb6a");
barSeries.columns.template.strokeOpacity = 0;
barSeries.tooltip.pointerOrientation = "horizontal";
barSeries.tooltip.getFillFromObject = false;
barSeries.tooltip.background.fill = am4core.color("#263238");
barSeries.tooltip.label.fill = am4core.color("#e8f5e9");


// Animación ejecutiva
barSeries.sequencedInterpolation = true;
barSeries.interpolationDuration = 600;

  // =========================
  // CLICK EN ESTADO (MAPA)
  // =========================
  polygonTemplate.events.on("hit", function (ev) {

  let entityName = ev.target.dataItem.dataContext.name;
  if (!entityName) return;

  currentState = entityName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  document.getElementById("stateSelect").value = currentState;

  loadChartData(currentCrime, currentState);
  loadPieData(currentYear, currentState);

  // 🔑 TREEMAP FEDERAL (AÑO FIJO 2025)
  loadTreemap(2025, entityName);
});


  function loadBarData(year) {
  fetch("data/victimas_entidad_anio.json")
    .then(r => r.ok ? r.json() : [])
    .then(data => {

      // Filtrar por año
      let filtered = data.filter(d => d.year == year);

      if (!filtered || filtered.length === 0) {
        barChart.data = [];
        return;
      }

      // Ordenar de mayor a menor
      filtered.sort((a, b) => b.value - a.value);

      barChart.data = filtered;
    })
    .catch(() => barChart.data = []);
}


loadBarData(currentYear);

  // =========================
  // SELECTORES
  // =========================
document.getElementById("yearSelect").addEventListener("change", function () {
  currentYear = this.value;

  loadMapData(currentYear, currentCrime);
  loadPieData(currentYear, currentState);
  loadBarData(currentYear);
  loadSexoStackData(currentYear);

  updateModalidadYear(currentYear);
  updateMonthlyChart(currentYear, currentMonthEntity);

  console.log("Modalidad año:", currentYear);
});

document.getElementById("yearCharts").addEventListener("change", function () {

  currentYear = parseInt(this.value);

  // 🔑 SOLO los gráficos de víctimas
  loadBarData(currentYear);
  loadSexoStackData(currentYear);
  updateModalidadYear(currentYear);
  updateMonthlyChart(currentYear, currentMonthEntity);

  // 🔄 sincronizar selector principal
  document.getElementById("yearSelect").value = currentYear;
});

  document.getElementById("crimeSelect").addEventListener("change", function () {
    currentCrime = this.value;
    loadMapData(currentYear, currentCrime);
    loadChartData(currentCrime, currentState);
  });

  var stateSelect = document.getElementById("stateSelect");
  stateSelect.addEventListener("change", function () {
    currentState = this.value === "" ? null : this.value;
    loadChartData(currentCrime, currentState);
  });

  document.getElementById("resetChart").addEventListener("click", function () {
    currentState = null;
    stateSelect.value = "";
    loadChartData(currentCrime);
    loadPieData(currentYear, null);
  });

  

  // =========================
// GRÁFICO 100% STACKED
// MODALIDAD DEL DELITO POR ENTIDAD
// =========================
var modalidadStackChart;
var modalidadRawData = [];

var greenPalette = [
  am4core.color("#1b5e20"),
  am4core.color("#2e7d32"),
  am4core.color("#388e3c"),
  am4core.color("#43a047"),
  am4core.color("#66bb6a")
];


modalidadStackChart = am4core.create(
  "modalidadStackChart",
  am4charts.XYChart
);

modalidadStackChart.background.fill = am4core.color("#121917");
modalidadStackChart.background.fillOpacity = 1;
modalidadStackChart.padding(12, 20, 10, 20);

// TÍTULO
var stackTitle = modalidadStackChart.titles.create();
stackTitle.text =
  "Distribución porcentual de tipos de delito por entidad federativa";
stackTitle.fontSize = 14;
stackTitle.fontWeight = "600";
stackTitle.fill = am4core.color("#a5d6a7");
stackTitle.marginBottom = 10;

// EJE X
var categoryAxis = modalidadStackChart.xAxes.push(
  new am4charts.CategoryAxis()
);
categoryAxis.dataFields.category = "Entidad";
categoryAxis.renderer.labels.template.rotation = -45;
categoryAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");
categoryAxis.renderer.minGridDistance = 40;
categoryAxis.renderer.cellStartLocation = 0.05;
categoryAxis.renderer.cellEndLocation = 0.95;

// SCROLL / ZOOM
modalidadStackChart.scrollbarX = new am4core.Scrollbar();
modalidadStackChart.cursor = new am4charts.XYCursor();
modalidadStackChart.cursor.behavior = "zoomX";
modalidadStackChart.cursor.lineX.disabled = true;
modalidadStackChart.cursor.lineY.disabled = true;

// EJE Y
var valueAxis = modalidadStackChart.yAxes.push(
  new am4charts.ValueAxis()
);
valueAxis.min = 0;
valueAxis.max = 100;
valueAxis.strictMinMax = true;
valueAxis.calculateTotals = true;
valueAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");

valueAxis.renderer.labels.template.adapter.add("text", t => t + "%");

// ❌ sin leyenda
modalidadStackChart.legend = null;

fetch("data/modalidad_por_entidad_100stack.json")
  .then(r => r.json())
  .then(data => {
    modalidadRawData = data;
    createModalidadSeries();    
    updateModalidadYear(currentYear);
  });

function createModalidadSeries() {

  const ignore = ["Año", "Entidad"];
  const sample = modalidadRawData[0];
  
Object.keys(sample).forEach(field => {

  // ⛔ excluir campos auxiliares
  if (
    ignore.includes(field) ||
    field.endsWith("_pct") ||
    field.endsWith("_casos")
  ) return;


    var series = modalidadStackChart.series.push(
      new am4charts.ColumnSeries()
    );

    series.dataFields.valueY = field;
    series.dataFields.categoryX = "Entidad";
    series.name = field;
    series.stacked = true;
    series.columns.template.width = am4core.percent(90);
    series.hiddenInLegend = false;
    series.columns.template.strokeOpacity = 0;
    series.minBulletDistance = 2;
    series.sequencedInterpolation = true;
    


    series.tooltipText = "{name}";
series.adapter.add("tooltipText", function (text, target) {

  if (!target.tooltipDataItem) return text;

  let ctx = target.tooltipDataItem.dataContext;
  let delito = target.name;

  let pct = ctx[delito + "_pct"];
  let casos = ctx[delito + "_casos"];

  if (pct === undefined || casos === undefined) return text;

  return (
    delito + ": " + pct + "%\n" +
    "Casos: " + casos
  );
});


    // Etiqueta nominal
var percentLabel = series.bullets.push(
  new am4charts.LabelBullet()
);


series.tooltipText =
  "{name}: {[name + '_pct']}%\n" +
  "Casos: {[name + '_casos']}";
percentLabel.label.fill = am4core.color("#ffffff");
percentLabel.label.fontSize = 11;
percentLabel.locationY = 0.5;
percentLabel.label.truncate = true;
percentLabel.label.hideOversized = true;

// 🔑 Mostrar solo si >5%
percentLabel.adapter.add("visible", function (v, t) {
  return t.dataItem && t.dataItem.valueY > 0 &&
         t.dataItem.valueYShow > 5;
});

  });
}

function updateModalidadYear(year) {

   if (!modalidadRawData || modalidadRawData.length === 0) return;

  // 🔥 LIMPIAR SERIES Y RECREARLAS
  modalidadStackChart.series.clear();

  let yearData = modalidadRawData.filter(d => String(d.Año) === String(year));


  // Delitos disponibles
  let delitos = Object.keys(yearData[0]).filter(
    k => k !== "Año" && k !== "Entidad"
  );

  // TOP 5 nacional
  let top5 = delitos
    .map(delito => ({
      delito,
      total: yearData.reduce((s, r) => s + (r[delito] || 0), 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(d => d.delito);

  // 🔑 NORMALIZAR POR TOP 5 LOCAL
  modalidadStackChart.data = yearData.map(row => {

    let totalTop5Entidad = top5.reduce(
      (s, d) => s + (row[d] || 0), 0
    );

    let obj = { Entidad: row.Entidad };

top5.forEach(d => {

let casos = row[d] || 0;
let porcentaje = totalTop5Entidad > 0
  ? (casos / totalTop5Entidad) * 100
  : 0;

// barra
obj[d] = porcentaje;

// tooltip
obj[d + "_pct"] = Math.round(porcentaje);
obj[d + "_casos"] = casos;


// valor real para la barra
obj[d] = porcentaje;

// valor redondeado SOLO para tooltip
obj[d + "_pct"] = Math.round(porcentaje);

// valor nominal
obj[d + "_casos"] = casos;


  // valor para la barra (porcentaje)
  obj[d] = porcentaje;

  // valor nominal para tooltip
  obj[d + "_casos"] = casos;
});


    return obj;
  });

  createModalidadSeries();
  
  modalidadStackChart.invalidateRawData();
}


// =========================
// GRÁFICO SEXO · BARRAS OPUESTAS
// =========================
sexoStackChart = am4core.create(
  "sexoStackChart",
  am4charts.XYChart
);

sexoStackChart.background.fill = am4core.color("#121917");
sexoStackChart.background.fillOpacity = 1;
sexoStackChart.padding(12, 20, 10, 20);


// TÍTULO
var title = sexoStackChart.titles.create();
title.text =
  "Número de víctimas por sexo y entidad federativa";
title.fontSize = 14;
title.fontWeight = "600";
title.fill = am4core.color("#a5d6a7");
title.marginBottom = 10;


// EJE Y (ENTIDADES)
var categoryAxis = sexoStackChart.yAxes.push(
  new am4charts.CategoryAxis()
);
categoryAxis.dataFields.category = "Entidad";
categoryAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");
categoryAxis.renderer.grid.template.strokeOpacity = 0.1;


// EJE X (VALORES)
var valueAxis = sexoStackChart.xAxes.push(
  new am4charts.ValueAxis()
);

valueAxis.calculateTotals = true;

valueAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");

valueAxis.renderer.grid.template.strokeOpacity = 0.1;

var greenPalette = [
  am4core.color("#1b5e20"), // Hombres
  am4core.color("#66bb6a"), // Mujeres
  am4core.color("#a5d6a7")  // No identificado
];

// SERIES
function createSexoSeries() {

  if (!sexoRawData.length) return;

  const ignore = ["Año", "Entidad"];
  const sample = sexoRawData[0];

  Object.keys(sample).forEach((field, index) => {

    if (ignore.includes(field)) return;

  var series = sexoStackChart.series.push(
  new am4charts.ColumnSeries()
);

series.dataFields.valueX = field;
series.dataFields.categoryY = "Entidad";
series.name = field;
series.stacked = true;

series.columns.template.height = am4core.percent(80);
series.columns.template.strokeOpacity = 0;

// Colores
series.columns.template.adapter.add("fill", function () {
  return greenPalette[index % greenPalette.length];
});

series.columns.template.adapter.add("stroke", function () {
  return greenPalette[index % greenPalette.length];
});

// ✅ TOOLTIP FUNCIONAL
series.columns.template.tooltipText =
  "{categoryY}\n" +
  "{name}: {valueX.formatNumber('#,###')} víctimas";
  });
}


function updateSexoYear(year) {

  let yearData = sexoRawData.filter(
    d => parseInt(d.Año) === parseInt(year)
  );

  if (!yearData.length) return;

  let processedData = yearData.map(d => {

    let total =
      (d.Hombres || 0) +
      (d.Mujeres || 0) +
      (d["No identificado"] || 0);

    return {
      Entidad: d.Entidad,
      Hombres: d.Hombres || 0,
      Mujeres: d.Mujeres || 0,
      "No identificado": d["No identificado"] || 0,
      total: total
    };
  });

  processedData.sort((a, b) => b.total - a.total);

  sexoStackChart.data = processedData;

  sexoStackChart.invalidateRawData();
  sexoStackChart.yAxes.getIndex(0).invalidate();
}



// SCROLL
sexoStackChart.scrollbarY = new am4core.Scrollbar();

function loadSexoStackData(year) {

  fetch("data/victimas_sexo_entidad_anio.json")
    .then(r => r.json())
    .then(data => {

      sexoRawData = data;

      // 🔑 crear series SOLO una vez
      if (sexoStackChart.series.length === 0) {
        createSexoSeries();
      }

      updateSexoYear(year);
    });
}

loadSexoStackData(currentYear);

// =========================
// GRÁFICO MENSUAL · LÍNEA
// =========================
monthlyChart = am4core.create(
  "monthlyChart",
  am4charts.XYChart
);

monthlyChart.background.fill = am4core.color("#121917");
monthlyChart.background.fillOpacity = 1;
monthlyChart.padding(12, 20, 10, 20);

// TÍTULO
var title = monthlyChart.titles.create();
title.text = "Evolución mensual de víctimas";
title.fontSize = 14;
title.fontWeight = "600";
title.fill = am4core.color("#a5d6a7");
title.marginBottom = 10;
// EJE X · MESES
var categoryAxis = monthlyChart.xAxes.push(
  new am4charts.CategoryAxis()
);
categoryAxis.dataFields.category = "mes";
categoryAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");

// EJE Y · VÍCTIMAS
var valueAxis = monthlyChart.yAxes.push(
  new am4charts.ValueAxis()
);
valueAxis.renderer.labels.template.fill =
  am4core.color("#c8e6c9");

  var series = monthlyChart.series.push(
  new am4charts.LineSeries()
);

series.dataFields.categoryX = "mes";
series.dataFields.valueY = "valor";
series.strokeWidth = 2;
series.stroke = am4core.color("#66bb6a");
series.fillOpacity = 0.2;

series.tooltipText =
  "{mes}\n{valueY.formatNumber('#,###')} víctimas";

var bullet = series.bullets.push(new am4charts.CircleBullet());
bullet.circle.radius = 4;
bullet.circle.fill = am4core.color("#66bb6a");

// CURSOR (🔑 CLAVE)
monthlyChart.cursor = new am4charts.XYCursor();
monthlyChart.cursor.lineX.strokeOpacity = 0;
monthlyChart.cursor.lineY.strokeOpacity = 0;

// FORZAR TOOLTIP EN BULLET
bullet.tooltipText = series.tooltipText;


function updateMonthlyChart(year, entidad = null) {

  if (!monthlyRawData.length) return;

  let filtered = monthlyRawData.filter(
  d => parseInt(d.Año) === parseInt(year)
);

  // Si hay entidad seleccionada
  if (entidad) {
    filtered = filtered.filter(d => d.Entidad === entidad);
  }

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  let monthlyData = meses.map(mes => {

    let total = filtered.reduce(
      (sum, d) => sum + (d[mes] || 0),
      0
    );

    return {
      mes: mes,
      valor: total
    };
  });

  monthlyChart.data = monthlyData;

  // 🔑 TÍTULO DINÁMICO
  title.text = entidad
    ? `Evolución mensual de víctimas · ${entidad}`
    : "Evolución mensual de víctimas · Nacional";

  monthlyChart.invalidateRawData();
}

function loadMonthlyData() {

  fetch("data/victimas_mensuales_entidad_anio.json")
    .then(r => r.json())
    .then(data => {

      monthlyRawData = data;

      updateMonthlyChart(currentYear, currentMonthEntity);
    });
}

loadMonthlyData();

polygonSeries.mapPolygons.template.events.on("hit", function (ev) {

  currentMonthEntity = ev.target.dataItem.dataContext.name;

    if (monthlyStateSelect) {
    monthlyStateSelect.value = currentMonthEntity;
  }

  updateMonthlyChart(currentYear, currentMonthEntity);
});

currentMonthEntity = null;
updateMonthlyChart(currentYear, null);

function onYearChange(year) {

  currentYear = year;

  updateSexoYear(year);
  updateMonthlyChart(year, currentMonthEntity);
}

const leyColorMap = {
  "CONTRA LA SALUD": "#1b5e20",
  "LEY FEDERAL CONTRA LA DELINCUENCIA ORGANIZADA (L.F.C.D.O.)": "#2e7d32",
  "LEY GENERAL DE SALUD (L.G.S.)": "#33691e",
  "OTRAS LEYES Y CODIGOS": "#004d40",
  "OTROS DELITOS": "#388e3c"
};

// =========================
// SELECTOR ENTIDAD · EVOLUCIÓN MENSUAL
// =========================
var monthlyStateSelect =
  document.getElementById("monthlyStateSelect");

monthlyStateSelect.addEventListener("change", function () {

  currentMonthEntity = this.value === "" ? null : this.value;

  updateMonthlyChart(currentYear, currentMonthEntity);
});



// =========================
// TREEMAP · DELITOS FEDERALES
// =========================
var currentYear = 2025;
var currentState = "Aguascalientes";

treemapChart = am4core.create("treemap", am4charts.TreeMap);

// Fondo
treemapChart.background.fill = am4core.color("#121917");
treemapChart.background.fillOpacity = 1;

// 🔴 ELIMINAR PALETA AZUL POR DEFECTO
treemapChart.colors.step = 0;
treemapChart.colors.list = [
  am4core.color("#1b5e20"),
  am4core.color("#2e7d32"),
  am4core.color("#33691e"),
  am4core.color("#004d40"),
  am4core.color("#1b5e20")
];

//treemapChart.seriesTemplates.template.heatRules.push({
  //target: treemapChart.seriesTemplates.template.columns.template,
  //property: "fill",
  //min: am4core.color("#a5d6a7"), // verde claro
  //max: am4core.color("#1b5e20")  // verde oscuro
//});


// Campos
treemapChart.dataFields.value = "value";
treemapChart.dataFields.name = "name";
treemapChart.dataFields.children = "children";
treemapChart.fillProperty = undefined;


// Configuración
treemapChart.maxLevels = 2;
treemapChart.initialDepth = 1;
treemapChart.zoomable = true;
treemapChart.sorting = "descending";

// Animación tipo demo
treemapChart.animationDuration = 1200;
treemapChart.animationEasing = am4core.ease.sinInOut;

// Navegación
treemapChart.navigationBar = new am4charts.NavigationBar();


// =========================
// PALETAS DE COLORES VERDES
// =========================
const greenPaletteLevel1 = [
  "#1b5e20",
  "#2e7d32",
  "#33691e",
  "#004d40",
  "#1b5e20"
];

const greenPaletteLevel2 = [
  "#43a047",
  "#4caf50",
  "#66bb6a",
  "#81c784",
  "#a5d6a7"
];


// =========================
// NIVEL 1 · CATEGORÍA
// =========================
let level1 = treemapChart.seriesTemplates.create("1");

level1.columns.template.adapter.add("fill", function (fill, target) {
  let name = target.dataItem.dataContext.name;

  if (leyColorMap[name]) {
    return am4core.color(leyColorMap[name]);
  }

  return am4core.color("#66bb6a");
});



// 🏷 Etiqueta nivel 1
let level1Label = level1.bullets.push(new am4charts.LabelBullet());
level1Label.locationX = 0.5;
level1Label.locationY = 0.5;
level1Label.label.text =
  "[bold]{name}[/]\n{value.formatNumber('#,###')}";
level1Label.label.fill = am4core.color("#e8f5e9");
level1Label.label.fontSize = 14;
level1Label.label.textAlign = "middle";
level1Label.label.wrap = true;

// Tooltip
level1.columns.template.tooltipText =
  "{name}\nTotal: {value.formatNumber('#,###')}";


// =========================
// NIVEL 2 · MODALIDAD
// =========================
let level2 = treemapChart.seriesTemplates.create("2");

level2.columns.template.adapter.add("fill", function (fill, target) {

  let parent = target.dataItem.parent;

  if (
    parent &&
    parent.dataContext &&
    leyColorMap[parent.dataContext.name]
  ) {
    return am4core
      .color(leyColorMap[parent.dataContext.name])
      .lighten(0.35);
  }

  return am4core.color("#43a047");
});


// 🎨 Color dinámico
level2.columns.template.adapter.add("fill", function (fill, target) {

  let parent = target.dataItem.parent;

  if (parent && parent.dataContext && parent.dataContext.name) {
    let parentName = parent.dataContext.name;

    if (leyColorMap[parentName]) {
      return am4core.color(leyColorMap[parentName]).lighten(0.35);
    }
  }

  return am4core.color("#a5d6a7");
});


// 🏷 Etiqueta nivel 2
let level2Label = level2.bullets.push(new am4charts.LabelBullet());
level2Label.locationX = 0.5;
level2Label.locationY = 0.5;
level2Label.label.text =
  "{name}\n[bold]{value.formatNumber('#,###')}[/]";
level2Label.label.fill = am4core.color("#0f1412");
level2Label.label.fontSize = 12;
level2Label.label.textAlign = "middle";
level2Label.label.wrap = true;

// Tooltip
level2.columns.template.tooltipText =
  "{name}\n{value.formatNumber('#,###')} casos";


// =========================
// TÍTULO
// =========================
let treemapTitle = treemapChart.titles.create();
treemapTitle.text =
  "Distribución de delitos del fuero federal por año y entidad federativa (2012–2025)";
treemapTitle.fontSize = 14;
treemapTitle.fontWeight = "600";
treemapTitle.fill = am4core.color("#a5d6a7");
treemapTitle.marginBottom = 10;


// =========================
// CONTROLES (AÑO / ENTIDAD)
// =========================
function updateTreemapFromControls() {
  let year = document.getElementById("treemapYear").value;
  let entidad = document.getElementById("treemapEntidad").value;

  if (!year || !entidad) {
    treemapChart.data = [];
    return;
  }
  loadTreemap(year, entidad);
}

document.getElementById("treemapEntidad")
  .addEventListener("change", updateTreemapFromControls);

document.getElementById("treemapYear")
  .addEventListener("change", updateTreemapFromControls);


// =========================
// CARGA DINÁMICA JSON
// =========================
function loadTreemap(year, entidad) {

  let cleanEntidad = entidad
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();

  let url = `data/federal_${year}_${cleanEntidad}_treemap.json`;

  console.log("Cargando treemap:", url);

  fetch(url)
    .then(r => {
      if (!r.ok) {
        treemapChart.data = [];
        return;
      }
      return r.json();
    })
    .then(data => {
      treemapChart.data = data;
      treemapChart.invalidateRawData(); // 🔑 animación
    })
    .catch(() => treemapChart.data = []);
}

function updateTreemap(year, state) {

  const filteredData = treemapData.filter(d =>
    d.year === year &&
    d.entidad === state
  );

  treemapChart.data = filteredData;
  treemapChart.invalidateRawData();
}


document.getElementById("stateSelect").value = "Aguascalientes";
document.getElementById("yearCharts").value = "2025";

updateTreemap(2025, "Aguascalientes");


});