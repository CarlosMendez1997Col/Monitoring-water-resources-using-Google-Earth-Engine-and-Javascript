////////////////////////////////////////////////////////////////// TIME SERIES OF PRECIPITATION  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// select feature collection of images
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var Basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
// filter data by calendar
var startYear = 2010;
var endYear = 2020;
var startDate = ee.Date.fromYMD(startYear, 1, 1);
var endDate = ee.Date.fromYMD(endYear + 1, 1, 1);
var years = ee.List.sequence(startYear, endYear);
var months = ee.List.sequence(1, 12);
//select CHIRPS dataset
var CHIRPS = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD');
CHIRPS = CHIRPS.filterDate(startDate, endDate);

var monthlyPrecip = ee.ImageCollection.fromImages(
    years.map(function(y) {
        return months.map(function(m) {
            var w = CHIRPS.filter(ee.Filter
                    .calendarRange(y, y, 'year'))
                    .filter(ee.Filter.calendarRange(m, m,'month'))
                    .sum();
            return w.set('year', y)
                    .set('month', m)
                    .set('system:time_start', ee.Date
                    .fromYMD(y, m, 1));
        });
    }).flatten()
);

var precipVis = {min: 0, max: 250, palette: 'white, blue, darkblue, red, purple'};
var title = {title: 'Monthly precipitation', hAxis: {title: 'Time'}, vAxis: {title: 'Precipitation (mm)'},
};

var chartMonthly = ui.Chart.image.seriesByRegion({
        imageCollection: monthlyPrecip,
        regions: Basin.geometry(),
        reducer: ee.Reducer.mean(),
        band: 'precipitation',
        scale: 5000,
        xProperty: 'system:time_start'
    }).setSeriesNames(['P'])
      .setOptions(title)
      .setChartType('ColumnChart');

print(chartMonthly);

Map.setOptions('SATELLITE')
Map.centerObject(Basin, 5);
Map.addLayer(Basin, {}, 'Basin');
Map.addLayer(monthlyPrecip.mean().clip(Basin), precipVis, '2015 precipitation');

////////////////////////////////////////////////////////////////// MONTHLY RAINFALL  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470));
var geometry = basin;
var year = 2023
var startDate = ee.Date.fromYMD(year, 1, 1)
var endDate = startDate.advance(1, 'year')
var yearFiltered = chirps.filter(ee.Filter.date(startDate, endDate))
print(yearFiltered)

var months = ee.List.sequence(1, 12)
var createMonthlyImage = function(month) {
  var startDate = ee.Date.fromYMD(year, month, 1)
  var endDate = startDate.advance(1, 'month')
  var monthFiltered = yearFiltered
    .filter(ee.Filter.date(startDate, endDate))
  // Calculate total precipitation
  var total = monthFiltered.reduce(ee.Reducer.sum())
  return total.set({
    'system:time_start': startDate.millis(),
    'system:time_end': endDate.millis(),
    'year': year,
    'month': month})
}

var monthlyImages = months.map(createMonthlyImage)
var monthlyCollection = ee.ImageCollection.fromImages(monthlyImages)
print(monthlyCollection)

var chart = ui.Chart.image.series({
  imageCollection: monthlyCollection,
  region: geometry,
  reducer: ee.Reducer.mean(),
  scale: 5566
}).setOptions({
      lineWidth: 1,
      pointSize: 3,
      title: 'Monthly Rainfall in Paranapanema River Basin',
      vAxis: {title: 'Rainfall (mm)'},
      hAxis: {title: 'Month', gridlines: {count: 12}}
})
print(chart)
Map.setOptions('SATELLITE')
Map.addLayer(geometry, {}, 'PRB')
////////////////////////////////////////////////////////////////// AVERAGE RAINFALL IN A BASIN  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var startDate = ee.Date.fromYMD(2022, 1,1)
var endDate = startDate.advance(1, 'year')
var filtered = chirps.filter(ee.Filter.date(startDate, endDate))

// Calculate yearly rainfall
var total = filtered.reduce(ee.Reducer.sum())
var palette = ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494']
var visParams = {min:0, max: 2000, palette: palette}

// Calculate average rainfall 
var stats = total.reduceRegion({ reducer: ee.Reducer.mean(), geometry: basin, scale: 5000, })
print(stats)
print('Average Rainfall:', stats.get('precipitation_sum'))

Map.setOptions('SATELLITE')
Map.addLayer(total, visParams, 'Total Precipitation')
Map.addLayer(basin, {}, 'Basin')
Map.centerObject(basin)
////////////////////////////////////////////////////////////////// ANUAL RAINFALL BY COUNTRY  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
             .filterDate('2020-01-01', '2020-12-31')
             .select('precipitation');

var annualPrecipitation = chirps.sum();
var countries = ee.FeatureCollection("FAO/GAUL/2015/level0");
var pakistan = countries.filter(ee.Filter.eq('ADM0_NAME', 'Mexico'));

var clippedPrecipitation = annualPrecipitation.clip(pakistan);
var precipitationVis = {min: 0, max: 1000, palette: ['white', 'blue', 'cyan', 'green', 'yellow', 'red']};
var legend = ui.Panel({ style: { position: 'bottom-right', padding: '8px 15px'}});
var legendColors = precipitationVis.palette;
var legendLabels = ['0', '100', '200', '300', '400', '500+'];

var makeLegend = function(colors, labels) {
  var entry = colors.map(function(color, index) {
    return ui.Panel({
      style: {
        backgroundColor: color, padding: '8px 10px', margin: '0 0 4 px 0'},
      widgets:
      [
        ui.Label({
          value: labels[index], style: {color: 'black'}
                })
      ]
    });
  });
  return ui.Panel(entry);
};

Map.setOptions('SATELLITE')
Map.centerObject(pakistan, 4);
Map.addLayer(clippedPrecipitation, precipitationVis, 'Annual Precipitation (mm)');
legend.add(makeLegend(legendColors, legendLabels));
Map.add(legend);
