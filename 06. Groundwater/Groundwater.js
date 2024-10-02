////////////////////////////////////////////////////////////////// MONITORING GROUNDWATER \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var geometry = ee.Geometry.MultiPoint(
        [[-51.359778, -22.657953],
         [-49.732000, -23.129000],
         [-49.230000, -23.2094445]]);

var location1 = [-51.359778, -22.657953];
var location2 = [-49.732000, -23.129000];
var location3 = [-49.230000, -23.2094445];

var pointFeature1 = ee.Feature(ee.Geometry.Point(location1));
var pointFeature2 = ee.Feature(ee.Geometry.Point(location2));
var pointFeature3 = ee.Feature(ee.Geometry.Point(location3));
var pointsCollection = ee.FeatureCollection([pointFeature1, pointFeature2, pointFeature3]);
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var studyArea = countries.filter(ee.Filter.eq('country_na', 'Brazil'));
var startDate = ee.Date('2003');
var endDate = ee.Date('2024');
var timeDifference = endDate.difference(startDate, 'month').round();


var groundwaterData = ee.ImageCollection("NASA/GLDAS/V022/CLSM/G025/DA1D")
                        .select('GWS_tavg') 
                        .filterDate(startDate, endDate);

var dateList = ee.List.sequence(0, ee.Number(timeDifference).subtract(1), 1).map(function(delta) {
  return ee.Date(startDate).advance(delta, 'month');
});

print(dateList)

var monthlyGW = ee.ImageCollection(dateList.map(function(date) {
  var start = ee.Date(date);
  var end = start.advance(1, 'month');
  var monthlyAverage = groundwaterData.filterDate(start, end).mean().rename('Groundwater');
  var numBands = monthlyAverage.bandNames().size();
  return monthlyAverage
    .set('system:time_start', start.millis())
    .set('system:time_end', end.millis())
    .set('system:index', start.format('YYYY-MM-dd'))
    .set('num_bands', ee.Number(numBands));
}))
.filter(ee.Filter.gt('num_bands', 0));

var groundwaterChart = ui.Chart.image.series({
  imageCollection: monthlyGW,
  region: studyArea,
  reducer: ee.Reducer.mean(),
  scale: 27000,
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Mean Groundwater Data for Study Area',
  hAxis: {title: 'Time'},
  vAxis: {title: 'Mean Groundwater Storage (GWS_tavg)'},
  colors: ['green'] 
});

print(groundwaterChart);

var pointChart = ui.Chart.image.seriesByRegion({
  imageCollection: monthlyGW,
  regions: pointsCollection,
  reducer: ee.Reducer.first(),
  band: 'Groundwater',
  scale: 27000,
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Groundwater Data for Selected Points',
  hAxis: {title: 'Time'},
  vAxis: {title: 'Groundwater Storage (GWS_tavg)'},
  colors: ['green', 'red', 'yellow'] 
});

Map.addLayer(pointFeature1, {}, 'Capivara');
Map.addLayer(pointFeature2, {}, 'Chavantes');
Map.addLayer(pointFeature2, {}, 'Jurumirim');
Map.addLayer(studyArea, {}, 'Brazil', true);
Map.centerObject(studyArea, 4);
Map.addLayer(monthlyGW.toBands().clip(studyArea), {}, 'Groundwater Data', true);
print(pointChart);

Export.image.toDrive({
  image: monthlyGW.toBands().clip(studyArea),
  description: 'Groundwater_Monitoring',
  scale: 27000,
  region: studyArea,
  crs: 'EPSG:4326',
  folder: 'groundwater_data_export'
});



