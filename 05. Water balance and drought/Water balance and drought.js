////////////////////////////////////////////////////////////////// TIME SERIES OF EVAPOTRANSPIRATION  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var Basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var startYear = 2010;
var endYear = 2020;
var startDate = ee.Date.fromYMD(startYear, 1, 1);
var endDate = ee.Date.fromYMD(endYear + 1, 1, 1);
var years = ee.List.sequence(startYear, endYear);
var months = ee.List.sequence(1, 12);
var mod16 = ee.ImageCollection('MODIS/006/MOD16A2').select('ET');
mod16 = mod16.filterDate(startDate, endDate);

var monthlyEvap = ee.ImageCollection.fromImages(
    years.map(function(y) {
        return months.map(function(m) {
            var w = mod16.filter(ee.Filter
                         .calendarRange(y, y, 'year'))
                         .filter(ee.Filter.calendarRange(m, m,'month'))
                         .sum()
                         .multiply(0.1);
            return w.set('year', y)
                    .set('month', m)
                    .set('system:time_start', ee.Date
                    .fromYMD(y, m, 1));
        });
    }).flatten()
);

var evapVis = { min: 0, max: 140, palette: 'red, orange, yellow, blue, darkblue'};
var title = { title: 'Monthly evapotranspiration', hAxis: { title: 'Time'},
              vAxis: {title: 'Evapotranspiration (mm)'},
             colors: ['red']};

var chartMonthly = ui.Chart.image.seriesByRegion({
        imageCollection: monthlyEvap,
        regions: Basin.geometry(),
        reducer: ee.Reducer.mean(),
        band: 'ET',
        scale: 500,
        xProperty: 'system:time_start'
    }).setSeriesNames(['ET'])
      .setOptions(title)
      .setChartType('ColumnChart');

Map.centerObject(Basin, 5);
Map.addLayer(Basin, {}, 'Basin');
Map.addLayer(monthlyEvap.mean().clip(Basin), evapVis,'Mean monthly ET');

print(chartMonthly);

////////////////////////////////////////////////////////////////// WATER BALANCE  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






