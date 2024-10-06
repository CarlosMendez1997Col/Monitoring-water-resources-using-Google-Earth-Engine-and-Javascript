////////////////////////////////////////////////////////////////// GLOBAL SURFACE WATER \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var occurrence = gsw.select('occurrence');
var visParams = { min:0, max:100, palette: ['red', 'blue']}
var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
Map.setOptions('SATELLITE')
Map.addLayer(occurrence, visParams, 'Water Occurence');

////////////////////////////////////////////////////////////////// SELECT AND CREATE WATER MASK \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var water = gsw.select('max_extent');
var masked = water.updateMask(water)
var masked = water.selfMask()
Map.setOptions('SATELLITE')
Map.addLayer(masked, {}, 'Water');

////////////////////////////////////////////////////////////////// FIND WATERBODIES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var water = gsw.select('transition'); 
var lostWater = water.eq(3).or(water.eq(6))
var visParams = { min:0, max:1, palette: ['white','red']}
var lostWater = lostWater.selfMask()
Map.setOptions('SATELLITE')
Map.addLayer(lostWater, visParams, 'Lost Water')

////////////////////////////////////////////////////////////////// GET YEARLY WATER HISTORY \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gswYearly = ee.ImageCollection("JRC/GSW1_4/YearlyHistory");
var filtered = gswYearly.filter(ee.Filter.eq('year', 2020))
var gsw2020 = ee.Image(filtered.first())
var water2020 = gsw2020.eq(2).or(gsw2020.eq(3))
var water2020 = water2020.selfMask()
var visParams = { bands: ['waterClass'], min: 0.0, max: 3.0, palette: ['cccccc', 'ffffff', '99d9ea', '0000ff']}
Map.setOptions('SATELLITE')
Map.setCenter(59.414, 45.182, 7);
Map.addLayer(water2020, visParams, '2020 Water')

////////////////////////////////////////////////////////////////// GLOBAL HYDROLOGICAL BASINS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// import MERIT Hydro: Global Hydrography Datasets
var merit = ee.Image("MERIT/Hydro/v1_0_1");

// import global digital surface model (DSM) dataset
var dem = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2")
dem = dem.select('DSM')
dem = dem.mosaic().multiply(10).setDefaultProjection(dem.first().projection())

// configure DEM using Terrain.hillshade and reproject the image using bicubic resampling.
var hs = ee.Terrain.hillshade(dem, 315).updateMask(dem.gt(0)).resample('bicubic')

var basins = ee.FeatureCollection("WWF/HydroATLAS/v1/Basins/level06")
var basinsRGB = ee.Image().paint(basins, 'HYBAS_ID').randomVisualizer().visualize()
var basinsHsv = basinsRGB.unitScale(0, 255).rgbToHsv()

var fvLayer = ui.Map.FeatureViewLayer('WWF/HydroSHEDS/v1/FreeFlowingRivers_FeatureView');

// Define the visualization parameters.
var visParams = {lineWidth: 1, opacity: 0.5,
  color: {property: 'RIV_ORD', mode: 'linear', palette: ['08519c', '3182bd', '6baed6', 'bdd7e7', 'eff3ff'], min: 1, max: 10, }
                };

fvLayer.setVisParams(visParams);
fvLayer.setName('Free flowing rivers');


Map.setOptions('SATELLITE')
Map.addLayer(hs, { palette: ['000000', '666666'] }, 'dem', true, 0.9)
Map.addLayer(ee.Image([basinsHsv.select(['hue']), basinsHsv.select(['saturation']), hs.rename('value').unitScale(0, 500)]).hsvToRgb(), {}, 'basins', true, 0.7)
Map.addLayer(merit.select('upa').unitScale(0, 10).selfMask(), { min: 0, max: 10000, palette: ['white'] }, 'flow accumulation', true, 0.5)
Map.add(fvLayer);


//////////////////////////////////////////////////////////////////  LOCATE A SUBBASIN \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
Map.setOptions('SATELLITE')
Map.centerObject(basin)
Map.addLayer(basin, {color: 'grey'}, 'Arkavathy Sub Basin')

//////////////////////////////////////////////////////////////////  CREATE A SURFACE WATER MAP \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater")
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var geometry = basin.geometry()
var water = gsw.select('seasonality');
var clipped = water.clip(geometry)
var visParams = {min:0, max:1, palette: ['white','blue']}
var clipped = clipped.unmask(0)
var waterProcessed = clipped
  .focalMax({ 'radius':30, 'units': 'meters', 'kernelType': 'square'})
  .focalMin({ 'radius':30, 'units': 'meters', 'kernelType': 'square'});
Map.setOptions('SATELLITE')
Map.centerObject(geometry, 10)
Map.addLayer(clipped, visParams, 'Surface Water') 
Map.addLayer(waterProcessed, visParams, 'Surface Water (Processed)')

//////////////////////////////////////////////////////////////////  CONVERT RASTER TO VECTOR \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var hydrobasins = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_4");
var basin = hydrobasins.filter(ee.Filter.eq('HYBAS_ID', 6040752470))
var geometry = basin.geometry()
var water = gsw.select('max_extent');
var clipped = water.clip(geometry)
var visParams = {min:0, max:1, palette: ['white','blue']}
var clipped = clipped.unmask(0)
var waterProcessed = clipped
  .focal_max({ 'radius':30, 'units': 'meters', 'kernelType': 'square'})
  .focal_min({ 'radius':30, 'units': 'meters', 'kernelType': 'square'});
var vector = waterProcessed.reduceToVectors({ reducer: ee.Reducer.countEvery(), geometry: geometry, scale: 30, maxPixels: 1e10, eightConnected: false })
var visParams = {color: 'blue'}
Map.setOptions('SATELLITE')
Map.centerObject(geometry, 10)
Map.addLayer(clipped, visParams, 'Surface Water', false) 
Map.addLayer(vector, visParams, 'Surface Water Polygons')
