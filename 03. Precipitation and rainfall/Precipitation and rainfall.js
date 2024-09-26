////////////////////////////////////////////////////////////////// MONTHLY RAINFALL  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470));

var geometry = basin;
Map.addLayer(geometry, {}, 'POI')

var year = 2023
var startDate = ee.Date.fromYMD(year, 1, 1)
var endDate = startDate.advance(1, 'year')
var yearFiltered = chirps
  .filter(ee.Filter.date(startDate, endDate))
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
      title: 'Monthly Rainfall at Bengaluru',
      vAxis: {title: 'Rainfall (mm)'},
      hAxis: {title: 'Month', gridlines: {count: 12}}
})
print(chart)



