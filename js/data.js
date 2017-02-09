var baseUrl = 'http://giv-oct.uni-muenster.de:8080/api/dataset/ref_ms';
var layerEndpoints = {
  Stadtteile: '_level1',
  Kommunalwahlbezirke: '_level2_1',
  Stimmbezirke: '_level3_1'
}
var authentication = '?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfbmFtZSI6IlJlZmVyZW5kdW0gTWFwIE3DvG5zdGVyIiwiaWF0IjoxNDg0NTc5NTUzfQ.AP0vY49C9NNtHEo6ZuDpqLgv6ATeWbIcPSJKc8-lljI'

var layerControl = L.control.layers().addTo(map);

$(document).ready(function() {
  loadLayer(buildUrl('Stadtteile'), function(layer){
    layerControl.addBaseLayer(layer, 'Stadtteile');
  });
  loadLayer(buildUrl('Kommunalwahlbezirke'), function(layer){
    layer.addTo(map);
    layerControl.addBaseLayer(layer, 'Kommunalwahlbezirke');
  });
  loadLayer(buildUrl('Stimmbezirke'), function(layer){
    layerControl.addBaseLayer(layer, 'Stimmbezirke');
  });
  loadGeneralInfo()
});

  map.on('baselayerchange', function(layer) {
    if(layer.name == 'Stimmbezirke') {
    alert('The dataset this visualization is based on did not contain any information about letter votes for this level of detail. As a result the shown participation numbers are only based on the number of people that voted in person. Thus the participation numbers apear to be lower than in the other two layers where the letter votes are included.');
  }
});

function loadGeneralInfo() {
  var url = baseUrl + '_general' + authentication;
  $.ajax({
      url: url,
      dataType: 'json',
      success: function(data) {
        console.log();
        overlay = L.geoJson($.geo.WKT.parse(data[0].affectedArea.value), {
          style:{weight: 2 ,
          fillOpacity: 0.5 ,
          fillColor: 'transparent',
          color: 'yellow',
          weight : 5}
        });
        layerControl.addOverlay(overlay, 'Affected Area');
      }
  })
}

function buildUrl(layerName){
  return baseUrl + layerEndpoints[layerName] + authentication
}

function loadLayer(url, callback) {
  $.ajax({
      url: url,
      dataType: 'json',
      success: function(data) {
        layer = L.geoJson(sparql2GeoJSON(data), {
            style: getStyle,
            onEachFeature: onEachFeature
        });
        callback(layer);
      }
  })
}

function sparql2GeoJSON(input) {
    var output = [];
    for (i in input) {
        var entry = input[i];
        var feature = {
            type: "Feature",
            geometry: {},
            properties: {}
        };
        feature.geometry = $.geo.WKT.parse(entry.wkt.value);
        if (feature.geometry.coordinates.length == 0){
			       feature.geometry = manuallyGetGeometry(entry.wkt.value)
		    }
		    feature.properties.name = entry.name.value;
        feature.properties.totalVoters = parseInt(entry.total.value);
        feature.properties.yes = parseInt(entry.yes.value);
        feature.properties.no = parseInt(entry.no.value);
        feature.properties.invalid = parseInt(entry.invalid.value);
        if(entry.description){
          feature.properties.description = entry.description.value;
        }
        output.push(feature);
    }
    return output;
}

function manuallyGetGeometry(wkt){
	var geometry = {
		"type": "Polygon" ,
		"coordinates":[]
	}

	var slice = wkt.slice(16,-3);
	var splitlist = slice.split("),(");
	for (var i = 0 ; i < splitlist.length ; i++){
		var splitlist2 = splitlist[i].split(",");
		geometry.coordinates[i] = [];
		for( var j = 0 ; j < splitlist2.length; j++){
			var coordinates = splitlist2[j].split(" ")
			geometry.coordinates[i][j] = coordinates
		}
	}
	return geometry;
}

map.on("baselayerchange", function (e) {
  overlay.bringToFront();
});

function getStyle(feature) {
    return {
        fillColor: getFillColor(feature),
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: getOpacity(feature)
    };
}

function getFillColor(feature) {
    if(feature.properties.no > feature.properties.yes) {
        return 'red'
    } else {
        return 'green'
    }
}


function getOpacity(feature) {
    return (feature.properties.no + feature.properties.yes + feature.properties.invalid) * 3 / feature.properties.totalVoters;
}

function zoomToFeature(feature) {
    map.fitBounds(feature.target.getBounds());
}

function onEachFeature(feature, layer) {
    var popupContent = [];
    popupContent.push("<b>District: </b>" + feature.properties.name)
    popupContent.push('<div class="chart_area"><svg class="participation_chart"></svg></div>')
    popupContent.push("<b><br/>Number of voters: </b>" + feature.properties.totalVoters)
    popupContent.push("<b><br/>Yes votes: </b>" + feature.properties.yes)
    popupContent.push("<b><br/>No votes: </b>" + feature.properties.no)
    popupContent.push("<b><br/>Invalid votes: </b>" + feature.properties.invalid)
    popupContent.push("<b><br/>Participation: </b>" + ((feature.properties.no + feature.properties.yes + feature.properties.invalid)* 100 / feature.properties.totalVoters).toFixed(2)+"%")

    if (feature.properties.description){
      popupContent.push("<br/><br/><b>Description</b><br/>")
      popupContent.push(feature.properties.description)

    }
    layer.bindPopup("<p>" + popupContent.join("") + "</p>");

    function chart() {
        var data = [{
                key: "Yes",
                value: feature.properties.yes,
                color: "green"
            },
            {
                key: "No",
                value: feature.properties.no,
                color: "red"
            },
            {
                key: "Invalid",
                value: feature.properties.invalid,
                color: "grey"
            }
        ];

        nv.addGraph(function() {
            var chart = nv.models.pieChart()
                .x(function(d) {return d.key;})
                .y(function(d) {return d.value;})
                .showLegend(true)
                .showTooltipPercent(true);

            d3.select(".participation_chart")
                .datum(data)
                .transition().duration(1200)
                .call(chart);

            return chart;
        });

    }
    layer.on({
        click: chart,
    });
}
