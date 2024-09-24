// Introduction 

function maskS2clouds(image) {
 var qa = image.select('QA60');
  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  // Both flags should be set to zero, indicating clear conditions.
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

// Map the function over one month of data and take the median.
// Load Sentinel-2 TOA reflectance data.
var dataset = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
                  .filterDate('2024-07-01', '2024-07-31')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);
                  
var rgbVis = { min: 0.0, max: 0.3, bands: ['B4', 'B3', 'B2'],};

Map.setCenter(-46.5, -23.5, 10);
Map.addLayer(dataset.median(), rgbVis, 'RGB');
