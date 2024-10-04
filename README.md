# Monitoring water resources using Google Earth Engine (GEE) and Javascript

## Description

Monitoring and analysis of water resources through remote sensing and satellite images using the `Google Earth Engine (GEE)` platform and `Javascript` language.

Each section is described below:

- First section, introduction to NVDI, MNDWI and AWEI index
- Second section, describes surface water bodies (watersheds, rivers and lakes)
- Third section, shows precipitation and rainfall calculations in time series (monthly and yearly)
- Fourth section, shows the spatial and temporal variations in river levels 
- Fifth section, calculates water balance using precipitation and evapotranspiration
- Sixth section, analyzes reservoir and groundwater levels

## Image collections and datasets

### 01.Introduction
```Javascript
ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
```
### 02.Surface Water
```Javascript
ee.ImageCollection("JRC/GSW1_4/YearlyHistory")

```
### 03.Precipitation and rainfall
```Javascript
ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
```
### 04.Hidrology
```Javascript
ee.ImageCollection('JRC/GSW1_3/YearlyHistory')
```
### 05.Water balance and drought
```Javascript
ee.ImageCollection('MODIS/006/MOD16A2')
ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
```

### 06.Groundwater
```Javascript
ee.ImageCollection("NASA/GLDAS/V022/CLSM/G025/DA1D")
ee.ImageCollection('NASA/GRACE/MASS_GRIDS/MASCON_CRI')
```

## Credits and repository of data

The original code, repositories and courses used in this project, are available at:

- Google Earth Engine for Water Resources Management (Full Course)
[link](https://courses.spatialthoughts.com/gee-water-resources-management.html)

- Aquatic and Hydrological Applications [link](https://google-earth-engine.com/Aquatic-and-Hydrological-Applications/Water-Balance-and-Drought/)

- Remote Sensing for Water Resources in Earth Engine [link](https://courses.spatialelearning.com/p/remote-sensing-for-water-resources-in-google-earth-engine)

- Google Earth Engine for Water Resources [link](https://youtube.com/playlist?list=PLmk0fUBXB9t2JKMd9rooggrJJCf7t8_hW&feature=shared)

## Conflict of Interest.

The author declare that there is no conflict of interest in the publication of this data and that all authors have approved it for publication.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.
