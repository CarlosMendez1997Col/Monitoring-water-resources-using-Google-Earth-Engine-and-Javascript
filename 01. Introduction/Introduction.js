
////////////////////////////////////////////////////////////////// SELECT SATELITAL IMAGE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function maskS2clouds(image) {
 var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

/* Sentinel-1 SAR GRD: ee.ImageCollection('COPERNICUS/S1_GRD')
   Sentinel-2 MSI: Multispectral Instrument Level-2A ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
   Sentinel-2 MSI: Multispectral Instrument Level-1C ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
   Sentinel-3 OLCI EFR: ee.ImageCollection('COPERNICUS/S3/OLCI')
   Sentinel-5P UV Aerosol Index ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_AER_AI") 
   Sentinel-5P Cloud ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CLOUD")
   Sentinel-5P Carbon Monoxide ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
   Sentinel-5P Formaldehyde ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_HCHO") 
   Sentinel-5P Nitrogen Dioxide ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
   Sentinel-5P Ozone ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
   Sentinel-5P Sulphur Dioxide ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
   Sentinel-5P Methane ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CH4") 
*/
var dataset = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
                  .filterDate('2024-07-01', '2024-07-31')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);
var rgbVis = { min: 0.0, max: 0.3, bands: ['B4', 'B3', 'B2'],};
Map.setCenter(-46.5, -23.5, 10);
Map.addLayer(dataset.median(), rgbVis, 'RGB');

////////////////////////////////////////////////////////////////// FILTER COLLECTION \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var geometry = /* color: #d63000 */ee.Geometry.Point([-46.5, -23.5]);
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
Map.centerObject(geometry, 10)

var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
var filtered = s2.filter(ee.Filter.date('2024-07-01', '2024-07-31'))
var filtered = s2.filter(ee.Filter.bounds(geometry))

var filtered1 = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
var filtered2 = filtered1.filter(ee.Filter.date('2024-07-01', '2024-07-31'))
var filtered3 = filtered2.filter(ee.Filter.bounds(geometry))

var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                  .filter(ee.Filter.date('2024-07-01', '2024-07-31')) 
                  .filter(ee.Filter.bounds(geometry))

print(filtered.size());


var geometry = /* color: #98ff00 */ee.Geometry.Point([-46.5, -23.5]);
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2'],};
var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2024-07-01', '2024-07-31'))
  .filter(ee.Filter.bounds(geometry))
  
var mosaic = filtered.mosaic() 
var medianComposite = filtered.median();
Map.centerObject(geometry, 10)
Map.addLayer(filtered, rgbVis, 'Filtered Collection');
Map.addLayer(mosaic, rgbVis, 'Mosaic');
Map.addLayer(medianComposite, rgbVis, 'Median Composite')

////////////////////////////////////////////////////////////////// FEATURES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
var Sao_Paulo = admin2.filter(ee.Filter.eq('ADM1_NAME', 'Sao Paulo'))

var visParams = {'color': 'blue'}
Map.addLayer(Sao_Paulo, visParams, 'Sao Paulo')

// CLIP
var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");

var selected = admin2.filter(ee.Filter.eq('ADM2_NAME', 'Sao Paulo'));
var geometry = selected.geometry();

Map.centerObject(geometry);

var rgbVis = { min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2'], };
var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2024-07-01', '2024-07-31'))
  .filter(ee.Filter.bounds(geometry));

var image = filtered.median();
var clipped = image.clip(geometry);

Map.addLayer(clipped, rgbVis, 'Clipped');

////////////////////////////////////////////////////////////////// INDEX CALCULATION  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
var selected = admin2.filter(ee.Filter.eq('ADM2_NAME', 'Sao Paulo'))
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
var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2']};
var ndviVis = {min:0, max:1, palette: ['white', 'green']}
var ndwiVis = {min:0, max:0.5, palette: ['white', 'blue']}

Map.centerObject(geometry, 10)
Map.addLayer(image.clip(geometry), rgbVis, 'Image');
Map.addLayer(ndvi.clip(geometry), ndviVis, 'ndvi')
Map.addLayer(mndwi.clip(geometry), ndwiVis, 'mndwi')
Map.addLayer(awei.clip(geometry), ndwiVis, 'awei') 

var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);
var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 
var awei = image.expression(
    '4*(GREEN - SWIR1) - (0.25*NIR + 2.75*SWIR2)', {
      'GREEN': image.select('B3').multiply(0.0001),
      'NIR': image.select('B8').multiply(0.0001),
      'SWIR1': image.select('B11').multiply(0.0001),
      'SWIR2': image.select('B12').multiply(0.0001),
}).rename('awei');

// Simple Thresholding
var waterMndwi = mndwi.gt(0)
var waterAwei = awei.gt(0)

// Combining Multiple Conditions
var waterMultiple = ndvi.lt(0).and(mndwi.gt(0))

var rgbVis = {min: 0, max: 3000, bands: ['B4', 'B3', 'B2']};
var waterVis = {min:0, max:1, palette: ['white', 'blue']}

Map.centerObject(geometry, 10)
Map.addLayer(image.clip(geometry), rgbVis, 'Image');
Map.addLayer(waterMndwi.clip(geometry), waterVis, 'MNDWI - Simple threshold')
Map.addLayer(waterAwei.clip(geometry), waterVis, 'AWEI - Simple threshold')
Map.addLayer(waterMultiple.clip(geometry), waterVis, 'MNDWI and NDVI Threshold')

////////////////////////////////////////////////////////////////// EXPORT IMAGE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var admin2 = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");

var selected = admin2.filter(ee.Filter.eq('ADM2_NAME', 'Sao Paulo'))
var geometry = selected.geometry()

var filtered = s2.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2024-07-01', '2024-07-31'))
  .filter(ee.Filter.bounds(geometry))

var image = filtered.median(); 

var ndvi = image.normalizedDifference(['B8', 'B4']).rename(['ndvi']);
var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 

var waterMndwi = mndwi.gt(0)

var rgbVis = {min: 0, max: 3000, bands: ['B4', 'B3', 'B2']};
var waterVis = {min:0, max:1, palette: ['black', 'white']}

Map.centerObject(geometry, 10)

Map.addLayer(image.clip(geometry), rgbVis, 'Image');
Map.addLayer(waterMndwi.clip(geometry), waterVis, 'MNDWI')

var exportImage = image.select(['B4', 'B3', 'B2'])

Export.image.toDrive({
  image: exportImage.clip(geometry),
  description: 'Raw_Composite_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite',
  region: geometry,
  scale: 10,
  maxPixels: 1e10})

var visualizedImage = image.visualize(rgbVis)

Export.image.toDrive({
  image: visualizedImage.clip(geometry),
  description: 'Visualized_Composite_Image',
  folder: 'earthengine',
  fileNamePrefix: 'composite_visualized',
  region: geometry,
  scale: 10,
  maxPixels: 1e10}) 
