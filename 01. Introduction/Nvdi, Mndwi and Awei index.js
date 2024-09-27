
////////////////////////////////////////////////////////////////// INDEX CALCULATION  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
var selected = admin2.filter(ee.Filter.eq('ADM2_NAME', 'Manaus'))
var geometry = selected.geometry()

var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                 .filter(ee.Filter.date('2024-07-01', '2024-07-31'))
                 .filter(ee.Filter.bounds(geometry))

var image = filtered.median(); 
// Calculate  Normalized Difference Vegetation Index (NDVI)
var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);
// Calculate Modified Normalized Difference Water Index (MNDWI)
var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 
// Calculate Automated Water Extraction Index (AWEI)
var awei = image.expression('4*(GREEN - SWIR1) - (0.25*NIR + 2.75*SWIR2)', {
                                                                            'GREEN': image.select('B3').multiply(0.0001),
                                                                            'NIR': image.select('B8').multiply(0.0001),
                                                                            'SWIR1': image.select('B11').multiply(0.0001),
                                                                            'SWIR2': image.select('B12').multiply(0.0001),
                                                                            }).rename('awei');
var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);
var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 
var waterMndwi = mndwi.gt(0)
var waterAwei = awei.gt(0)
var waterMultiple = ndvi.lt(0).and(mndwi.gt(0))

var ndwiVis = {min:0, max:0.5, palette: ['white', 'blue']}
var ndviVis = {min:0, max:1, palette: ['white', 'green']}
var rgbVis = {min: 0, max: 3000, bands: ['B4', 'B3', 'B2']};
var waterVis = {min:0, max:1, palette: ['white', 'blue']}

Map.centerObject(geometry, 10)
Map.addLayer(image.clip(geometry), rgbVis, 'Image')
Map.addLayer(ndvi.clip(geometry), ndviVis, 'ndvi')
Map.addLayer(mndwi.clip(geometry), ndwiVis, 'mndwi')
Map.addLayer(awei.clip(geometry), ndwiVis, 'awei')
Map.addLayer(waterMndwi.clip(geometry), waterVis, 'MNDWI - Simple threshold')
Map.addLayer(waterAwei.clip(geometry), waterVis, 'AWEI - Simple threshold')
Map.addLayer(waterMultiple.clip(geometry), waterVis, 'MNDWI and NDVI Threshold')


Export.image.toDrive({
  image: ndvi.clip(geometry),
  description: 'NVDI_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite',
  region: geometry,
  scale: 10,
  maxPixels: 1e10})

Export.image.toDrive({
  image: mndwi.clip(geometry),
  description: 'MNDWI_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite_visualized',
  region: geometry,
  scale: 10,
  maxPixels: 1e10}) 

Export.image.toDrive({
  image: waterMndwi.clip(geometry),
  description: 'waterMndwi_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite_visualized',
  region: geometry,
  scale: 10,
  maxPixels: 1e10}) 

Export.image.toDrive({
  image: waterAwei.clip(geometry),
  description: 'waterAwei_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite_visualized',
  region: geometry,
  scale: 10,
  maxPixels: 1e10}) 

Export.image.toDrive({
  image: waterMultiple.clip(geometry),
  description: 'waterMultiple_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite_visualized',
  region: geometry,
  scale: 10,
  maxPixels: 1e10}) 


