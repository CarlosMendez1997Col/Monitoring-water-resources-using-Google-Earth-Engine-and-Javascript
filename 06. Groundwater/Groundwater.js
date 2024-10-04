////////////////////////////////////////////////////////////////// GROUNDWATER USING GLDAS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

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
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var studyArea = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470));
//var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
//var studyArea = countries.filter(ee.Filter.eq('country_na', 'Brazil'));
var startDate = ee.Date('2003');
var endDate = ee.Date('2024');
var timeDifference = endDate.difference(startDate, 'month').round();

var groundwaterData = ee.ImageCollection("NASA/GLDAS/V022/CLSM/G025/DA1D")
                        .select('GWS_tavg') 
                        .filterDate(startDate, endDate);

var dateList = ee.List.sequence(0, ee.Number(timeDifference).subtract(1), 1).map(function(delta) { return ee.Date(startDate).advance(delta, 'month');});
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

var groundwaterChart = ui.Chart.image.series({ imageCollection: monthlyGW, region: studyArea, reducer: ee.Reducer.mean(), scale: 27000, xProperty: 'system:time_start'}
                                            ).setOptions({ title: 'Mean Groundwater Data for Study Area', 
                                                           hAxis: {title: 'Time'},
                                                           vAxis: {title: 'Mean Groundwater Storage (GWS_tavg)'},
                                                           colors: ['green'] });

var pointChart = ui.Chart.image.seriesByRegion({ imageCollection: monthlyGW, regions: pointsCollection, reducer: ee.Reducer.first(), band: 'Groundwater', scale: 27000,
                                                       xProperty: 'system:time_start'}).setOptions({ title: 'Groundwater Data for Selected Points',
                                                                                                     hAxis: {title: 'Time'},
                                                                                                     vAxis: {title: 'Groundwater Storage (GWS_tavg)'},
                                                                                                     colors: ['green', 'red', 'yellow'] });

print(dateList)
print(groundwaterChart);
print(pointChart);
Map.addLayer(pointFeature1, {}, 'Capivara');
Map.addLayer(pointFeature2, {}, 'Chavantes');
Map.addLayer(pointFeature2, {}, 'Jurumirim');
Map.addLayer(studyArea, {}, 'Paranapanema River Basin', true);
Map.centerObject(studyArea, 4);
Map.addLayer(monthlyGW.toBands().clip(studyArea), {}, 'Groundwater Data', true);

Export.image.toDrive({ image: monthlyGW.toBands().clip(studyArea), description: 'Groundwater_Monitoring', scale: 27000, region: studyArea, crs: 'EPSG:4326',
                      folder: 'groundwater_data_export'});

////////////////////////////////////////////////////////////////// GROUNDWATER USING GRACE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470));
var geometry = ee.Geometry.MultiPoint([[-51.359778, -22.657953], [-49.732000, -23.129000], [-49.230000, -23.2094445]]);

var location1 = [-51.359778, -22.657953];
var location2 = [-49.732000, -23.129000];
var location3 = [-49.230000, -23.2094445];
var pointFeature1 = ee.Feature(ee.Geometry.Point(location1));
var pointFeature2 = ee.Feature(ee.Geometry.Point(location2));
var pointFeature3 = ee.Feature(ee.Geometry.Point(location3));
var pointsCollection = ee.FeatureCollection([pointFeature1, pointFeature2, pointFeature3]);

var GRACE = ee.ImageCollection('NASA/GRACE/MASS_GRIDS/MASCON_CRI');
var basinTWSa = GRACE.select('lwe_thickness');

var TWSaChart = ui.Chart.image.series({
        imageCollection: basinTWSa.filter(ee.Filter.date('2003-01-01', '2016-12-31')), region: basin, reducer: ee.Reducer.mean(),})
                                  .setOptions({title: 'TWSa', 
                                               hAxis: {format: 'MM-yyyy'}, 
                                               vAxis: {title: 'TWSa (cm)'},
                                           lineWidth: 1,});
print(TWSaChart);

var yrStart = 2003;
var yrEnd = 2016;
var years = ee.List.sequence(yrStart, yrEnd);
var GRACE_yr = ee.ImageCollection.fromImages(years.map(function(y){
    var date = ee.Date.fromYMD(y, 1, 1);
    return basinTWSa.filter(ee.Filter.calendarRange(y, y, 'year'))
                    .mean()
                    .set('system:time_start', date)
                    .rename('TWSa'); })
                    .flatten());

var TWSaChart = ui.Chart.image.series({imageCollection: GRACE_yr.filter(ee.Filter.date('2003-01-01', '2016-12-31')),
                                                region: basin,
                                               reducer: ee.Reducer.mean(),
                                                 scale: 25000})
                  .setChartType('ScatterChart').setOptions({title: 'Annualized Total Water Storage anomalies', 
                                                            trendlines: {0: {color: 'CC0000'}},
                                                                 hAxis: {format: 'MM-yyyy'},
                                                                 vAxis: {title: 'TWSa (cm)'},
                                                             lineWidth: 2,
                                                             pointSize: 2 });
print(TWSaChart);

var addVariables = function(image) {
    var date = ee.Date(image.get('system:time_start'));
    var years = date.difference(ee.Date('2003-01-01'), 'year');
    return image
        .addBands(ee.Image(years).rename('t').float())
        .addBands(ee.Image.constant(1)); };

var cvTWSa = GRACE_yr.filterBounds(basin).map(addVariables);
var independents = ee.List(['constant', 't']);
var dependent = ee.String('TWSa');
var trend = cvTWSa.select(independents.add(dependent))
    .reduce(ee.Reducer.linearRegression(independents.length(), 1));
var coefficients = trend.select('coefficients')
    .arrayProject([0])
    .arrayFlatten([independents]);
var slope = coefficients.select('t');
var slopeParams = {min: -3.5, max: 3.5, palette: ['red', 'white', 'blue'] };

print(cvTWSa);
Map.centerObject(basin, 6);
Map.addLayer(basin, { color: 'green'}, 'Central Valley Basins', true, 0.5);
Map.addLayer(pointsCollection, {color: 'blue'}, 'Reservoirs');
Map.addLayer(slope.clip(basin), slopeParams, 'TWSa Annualized Trend', true, 0.75);

