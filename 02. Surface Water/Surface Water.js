////////////////////////////////////////////////////////////////// GLOBAL SURFACE WATER \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var occurrence = gsw.select('occurrence');
var visParams = { min:0, max:100, palette: ['red', 'blue']}
Map.addLayer(occurrence, visParams, 'Water Occurence');
var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");

////////////////////////////////////////////////////////////////// SELECT AND CREATE WATER MASK \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var water = gsw.select('max_extent');
var masked = water.updateMask(water)
var masked = water.selfMask()
Map.addLayer(masked, {}, 'Water');

////////////////////////////////////////////////////////////////// FIND WATERBODIES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var water = gsw.select('transition'); 
var lostWater = water.eq(3).or(water.eq(6))
var visParams = { min:0, max:1, palette: ['white','red']}
var lostWater = lostWater.selfMask()
Map.addLayer(lostWater, visParams, 'Lost Water')

////////////////////////////////////////////////////////////////// GET YEARLY WATER HISTORY \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gswYearly = ee.ImageCollection("JRC/GSW1_4/YearlyHistory");
var filtered = gswYearly.filter(ee.Filter.eq('year', 2020))
var gsw2020 = ee.Image(filtered.first())
var water2020 = gsw2020.eq(2).or(gsw2020.eq(3))
var water2020 = water2020.selfMask()
var visParams = { bands: ['waterClass'], min: 0.0, max: 3.0, palette: ['cccccc', 'ffffff', '99d9ea', '0000ff']}
Map.setCenter(59.414, 45.182, 7);
Map.addLayer(water2020, visParams, '2020 Water')

//////////////////////////////////////////////////////////////////  LOCATE A SUBBASIN \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
Map.centerObject(basin)
Map.addLayer(basin, {color: 'grey'}, 'Arkavathy Sub Basin')

//////////////////////////////////////////////////////////////////  CREATE A SURFACE WATER MAP \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater")
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var geometry = basin.geometry()
Map.centerObject(geometry, 10)
var water = gsw.select('seasonality');
var clipped = water.clip(geometry)
var visParams = {min:0, max:1, palette: ['white','blue']}
Map.addLayer(clipped, visParams, 'Surface Water') 
var clipped = clipped.unmask(0)
var waterProcessed = clipped
  .focalMax({ 'radius':30, 'units': 'meters', 'kernelType': 'square'})
  .focalMin({ 'radius':30, 'units': 'meters', 'kernelType': 'square'});
Map.addLayer(waterProcessed, visParams, 'Surface Water (Processed)')


//////////////////////////////////////////////////////////////////  CONVERT RASTER TO VECTOR \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var geometry = basin.geometry()
Map.centerObject(geometry, 10)
var water = gsw.select('max_extent');
var clipped = water.clip(geometry)
var visParams = {min:0, max:1, palette: ['white','blue']}
Map.addLayer(clipped, visParams, 'Surface Water', false) 
var clipped = clipped.unmask(0)
var waterProcessed = clipped
  .focal_max({ 'radius':30, 'units': 'meters', 'kernelType': 'square'})
  .focal_min({ 'radius':30, 'units': 'meters', 'kernelType': 'square'});
var vector = waterProcessed.reduceToVectors({ reducer: ee.Reducer.countEvery(), geometry: geometry, scale: 30, maxPixels: 1e10, eightConnected: false })
var visParams = {color: 'blue'}
Map.addLayer(vector, visParams, 'Surface Water Polygons')

