////////////////////////////////////////////////////////////////// RIVER MORPHOLOGY \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var getUTMProj = function(lon, lat) 
{
    var utmCode = ee.Number(lon).add(180).divide(6).ceil().int();
    var output = ee.Algorithms.If
    ({
        condition: ee.Number(lat).gte(0),
        trueCase: ee.String('EPSG:326').cat(utmCode.format('%02d')),
        falseCase: ee.String('EPSG:327').cat(utmCode.format('%02d'))
    });
    return (output);
};
var jrcYearly = ee.ImageCollection('JRC/GSW1_3/YearlyHistory');
var poi = ee.Geometry.LineString([[-70.01450764660864, -4.184167027937988],
                                 [-70.01158940320044, -4.180633845897112]]);
var rwcFunction = require('users/eeProject/RivWidthCloudPaper:rwc_watermask.js');
var GetNearestClGen = function(poi) 
{
    var temp = function(widths) 
    {
        widths = widths.map(function(f) {return f.set('dist2cl', f.distance(poi,30));
        });
        return ee.Feature(widths.sort('dist2cl', true).first());
    };
    return temp;
};
var getNearestCl = GetNearestClGen(poi);
// Multitemporal width extraction.
var polygon = poi.buffer(2000);
var coords = poi.centroid().coordinates();
var lon = coords.get(0);
var lat = coords.get(1);
var crs = getUTMProj(lon, lat);
var scale = ee.Number(30);

var multiwidths = ee.FeatureCollection(jrcYearly.map(function(i) 
{
    var watermask = i.gte(2).unmask(0);
    watermask = ee.Image(watermask.rename(['waterMask'])
        .setMulti({crs: crs, scale: scale, image_id: i.getNumber('year')}));
    var rwc = rwcFunction.rwGen_waterMask(2000, 333, 300,polygon);
    var widths = rwc(watermask).filter(ee.Filter.eq('endsInWater', 0))
                               .filter(ee.Filter.eq('endsOverEdge', 0));
    return ee.Algorithms.If(widths.size(), getNearestCl(widths), null);
}, true));

var widthTs = ui.Chart.feature.byFeature(multiwidths, 'image_id', ['width']) .setOptions(
  {
        hAxis: { title: 'Year', format: '####'},
        vAxis: { title: 'Width (meter)'},
        title: 'River width time series upstream of the Three Gorges Dam'
  }
);
print(widthTs);
Map.centerObject(polygon);
Map.addLayer(polygon, {}, 'area of width calculation');


////////////////////////////////////////////////////////////////// CHANGES IN A RIVER \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

var aoi = ee.Geometry.Polygon(
        [[[-66.75498758257174, -11.090110301403685],
          [-66.75498758257174, -11.258517279582335],
          [-66.56650339067721, -11.258517279582335],
          [-66.56650339067721, -11.090110301403685]]], null, false);
var sword = ee.FeatureCollection("projects/gee-book/assets/A2-4/SWORD");

var getUTMProj = function(lon, lat) {
    var utmCode = ee.Number(lon).add(180).divide(6).ceil().int();
    var output = ee.Algorithms.If(ee.Number(lat).gte(0),
        ee.String('EPSG:326').cat(utmCode.format('%02d')),
        ee.String('EPSG:327').cat(utmCode.format('%02d')));
    return (output);
};

var coords = aoi.centroid(30).coordinates();
var lon = coords.get(0);
var lat = coords.get(1);
var crs = getUTMProj(lon, lat);
var scale = ee.Number(15);

var rpj = function(image) 
{
    return image.reproject({ crs: crs, scale: scale });
};

var jrcYearly = ee.ImageCollection('JRC/GSW1_3/YearlyHistory');

var watermask = jrcYearly.filter(ee.Filter.eq('year', 2000)).first()
    .gte(2).unmask(0)
    .clip(aoi);

Map.centerObject(aoi);

watermask = watermask.focal_max().focal_min();

var MIN_SIZE = 2E3;
var barPolys = watermask.not().selfMask()
    .reduceToVectors({ geometry: aoi, scale: 15, eightConnected: true})
    .filter(ee.Filter.lte('count', MIN_SIZE)); // Get small polys.
var filled = watermask.paint(barPolys, 1);

var costmap = filled.not().cumulativeCost({
    source: watermask.and(ee.Image().toByte().paint(sword,1)),
    maxDistance: 3E3,
    geodeticDistance: false
});

var rivermask = costmap.eq(0).rename('riverMask');
var channelmask = rivermask.and(watermask);

Map.addLayer(watermask, {}, 'watermask', true);
Map.addLayer(rpj(filled), { min: 0, max: 1}, 'filled water mask', true);
Map.addLayer(sword, {color: 'red'}, 'sword', true);

Map.addLayer(rpj(costmap), {min: 0, max: 1E3}, 'costmap', true);
Map.addLayer(rpj(rivermask), {}, 'rivermask', true);
Map.addLayer(rpj(channelmask), {}, 'channelmask', true);

