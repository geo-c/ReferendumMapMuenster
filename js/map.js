
var map = L.map('map', {
    center: [51.959312, 7.617267],
    zoom: 12,
    minZoom: 11,
    zoomControl: true
});



map.setMaxBounds([
    [51.7475880511, 7.3663330078],
    [52.2254460954, 7.8524780273]
]);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    noWrap: true,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.sidebar('sidebar').addTo(map);


L.control.window(map,{title:'Welcome to the Referendum Map Münster',maxWidth:400,modal: true})
.content('</br><p>Here you will be provided with infomation regarding the recent referendum that took place in Münster on November 6th in 2016. The question of the referendum was if shops should NOT be opened on two additional sundays. For more information go to the Help-Section. For the results just click on the district that you want to know the Yes, No and Invalid votes.</p>')
.prompt({callback:function(){}})
.show();


var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML +='<strong><center>Legend</center></strong>';
    div.innerHTML += '<div class="legend_entry"><i style="background:green"></i> yes </div>'
    div.innerHTML += '<div class="legend_entry"><i style="background:red"></i> no </div>'
    div.innerHTML += '<div class="legend_entry"><i class="gradient"></i> participation </div>'
    return div;
};

legend.addTo(map);

map.zoomControl.setPosition('bottomright');
