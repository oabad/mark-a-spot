/**
 * Mark-a-Spot marker_leaflet.js
 *
 * Main Map-Application File with Leaflet Maps api
 * *
 *
 * @copyright  2012 Holger Kreis <holger@markaspot.org>
 * @link       http://mark-a-spot.org/
 * @version    2.1.2
 */

var arg = "";
var markerLayer, queryString ;
(function ($) {
  $(document).ready(function () {
    if ($('#markers-list-view #map').length != 0){
      var offset = $("#markers-list-view #map").offset();
      var topPadding = 120;
      $(window).scroll(function() {
          if ($(window).scrollTop() > offset.top) {
              $("#markers-list-view #map, #loading-indicator-map-overlay, #loading-indicator-map").stop().animate({
                  marginTop: $(window).scrollTop() - offset.top + topPadding
              });
          } else {
              $("#map").stop().animate({
                  marginTop: 0
              });
          };
      });
    }

    var mas = Drupal.settings.mas;

    Drupal.Geolocation = new Object();
    Drupal.Geolocation.maps = new Array();
    Drupal.Geolocation.markers = new Array();
    var categoryCond = mas.params.field_category_tid;
    var statusCond = mas.params.field_status_tid;
    var queryString =  mas.params.q.split('?');

    var pathId = mas.params.q.split('/');


    /**
     * Split URL and read MarkerID
     *
     */

    switch (pathId[0]) {
      case "map":
        readData(1, arg, "All", "All");
        arg = '';
        break;
      case "list":
        readData(2, "list", "All", "All");
        break;
      break;
      case "node":
        readData(2, pathId[1], categoryCond, statusCond);
        break;
      case "admin":
      case "overlay":
        return false;
      default:
        return false;
      break;
    }

    var initialLatLng = new L.LatLng(mas.markaspot_ini_lat, mas.markaspot_ini_lng);

    Drupal.Geolocation.maps[0] = new L.Map('map');
    var cloudmadeUrl = 'https://ssl_tiles.cloudmade.com/'+ mas.cloudmade_api_key +'/22677/256/{z}/{x}/{y}.png',
        cloudmadeAttribution = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
        cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});

    Drupal.Geolocation.maps[0].setView(new L.LatLng(mas.markaspot_ini_lat, mas.markaspot_ini_lng), 13).addLayer(cloudmade);

    $("#markers-list").append("<ul>");


    /**Sidebar Marker-functions*/

    $("#block-markaspot-logic-taxonomy-category ul li a.map-menue").click(function(e){
      e.preventDefault();
      hideMarkers();
      readData(1, arg, getTaxId(this.id), "All");
      return false;
    });

    $("#block-markaspot-logic-taxonomy-status ul li a.map-menue").click(function(e){
      e.preventDefault();
      hideMarkers();
      readData(2, arg, "All", getTaxId(this.id));
      return false;
    });

    $("#block-markaspot-logic-taxonomy-category ul li a.map-menue-all").click(function(e){
      e.preventDefault();
      hideMarkers();
      readData(1, arg, "All", "All");
      return false;
    });

    $("#block-markaspot-logic-taxonomy-status ul li a.map-menue-all").click(function(e){
      e.preventDefault();
      hideMarkers();
      readData(2, arg, "All", "All");
      return false;
    });


    function getTaxId(id){
      id = id.split("-");
      return id[1];
    }


    function readData(getToggle, arg, categoryCond, statusCond) {
      // markerLayer = new L.LayerGroup();
      markerLayer = new L.MarkerClusterGroup({disableClusteringAtZoom : 15, maxClusterRadius : 40 });

      uri = mas.uri.split('?');

      if (mas.node_type == "report"){
        url = Drupal.settings.basePath + 'reports/json/' + arg;
      } else if (uri[0].search('node/') != -1){
        url = Drupal.settings.basePath + 'reports/json/' + arg;
      } else if (uri[0].search('map') != -1 || uri[0].search('home') != -1 ){
        // map view
        url = Drupal.settings.basePath + 'reports/json/?' + 'field_category_tid=' + categoryCond + '&field_status_tid=' + statusCond;
      } else {
        url = Drupal.settings.basePath + 'reports/json?' + uri[1];
        categoryCond = mas.params.field_category_tid;
        statusCond = mas.params.field_status_tid;
      }
      // $("#markersidebar >*").remove();
        $('#map').showLoading({'indicatorZIndex':2,'overlayZIndex':1, 'parent': '#map'});

      $.getJSON(url, function(data){
      }).success(function(data){
        $('#map').hideLoading();
      }).done(function(data){
        data = data.nodes;

        points = [];
        var bounds = new L.LatLngBounds(initialLatLng);

        //var infoWindow = new google.maps.InfoWindow;

        if (!data[0] && mas.node_type == 'report') {
          // invoke a message box or something less permanent than an alert box later
          alert(Drupal.t('No reports found for this category/status'));
        }
        $.each(data, function(markers, item){
          if (item.node.positionLat && item.node.positionLat != mas.markaspot_ini_lat){
            item = item.node;
            var latlon = new L.LatLng(item.positionLat,item.positionLng);
            var html = '<div class="marker-title"><h4><a class="infowindow-link" href="' + item.path + '">' + item.title + '</a></h4><span class="meta-info date">' + item.created + '</span></div>';
            if (item.address){
              html += '<div class="marker-address"><p>'+ item.address + '</p></div>';
              html += '<div><a class="infowindow-link" href="' + item.path + '">mehr lesen</a></div>';
            }

            if (getToggle == 1) {
              colors = [
               {"color" : "red", "hex"  : "FF0000"},
               {"color" : "darkred", "hex"  : "8B0000" },
               {"color" : "orange", "hex"  : "FFA500" },
               {"color" : "green", "hex"  : "008000"},
               {"color" : "darkgreen", "hex"  : "006400"},
               {"color" : "blue", "hex"  : "0000FF"},
               {"color" : "darkblue", "hex"  : "00008B"},
               {"color" : "purple" , "hex" : "800080"},
               {"color" : "darkpurple", "hex"  : "871F78"},
               {"color" : "cadetblue", "hex"  : "5F9EA0"},
              ]
            }
            if (getToggle == 2) {
              colors = [
                {"color" : "red", "hex" : "cc0000"},
                {"color" : "green" , "hex" : "8fe83b"},
                {"color" : "orange" , "hex" : "ff6600"},
              ]
            }

            $.each(colors, function(key, element) {
              if (item.statusHex == element.hex || item.categoryHex == element.hex) {
                var awesomeColor = element.color;
                var awesomeIcon = (getToggle == 1) ? item.categoryIcon  : item.statusIcon;
                var marker = new L.Marker(latlon, {icon: L.AwesomeMarkers.icon({icon: awesomeIcon, color: awesomeColor, spin: false}) });
                marker.bindPopup(html)
                markerLayer.addLayer(marker);
                bounds.extend(latlon);
               }
            });

            var fn  = markerClickFn(latlon, html);

            $('#marker_' + item.nid).on('hover', fn);
            if (arg == 'list') {
              img = $('<img class="pull-left thumbnail"/>').attr('src', 'https://ssl_tiles.cloudmade.com/' + mas.cloudmade_api_key + '/staticmap?&amp;zoom=15&amp;size=100x100&amp;format=png&amp;styleid=22677&amp;center=' + item.positionLat + ',' + item.positionLng + '&amp;markers=size%3Amid%7Ccolor%3Ared%7C50.8211546%2C6.895930599999929center=' + item.positionLat + "," + item.positionLng + '&sensor=true&zoom=13&size=100x100');
              $('.body_' + item.nid).before(img);
            }
          }
        }); // $.each

        Drupal.Geolocation.maps[0].addLayer(markerLayer);
        // Drupal.Geolocation.maps[0].fitBounds(bounds);
      });
     }

  });

})(jQuery);



function hideMarkers(){
  Drupal.Geolocation.maps[0].removeLayer(markerLayer);
  return;
};

function bindInfoWindow(marker, map, infoWindow, html) {
  google.maps.event.addListener(marker, 'click', function() {
    Drupal.Geolocation.maps[0].setView(marker.getPosition());
    Drupal.Geolocation.maps[0].setZoom(15);
    infoWindow.setContent(html);
    infoWindow.open(map, marker);
  });
}

function markerClickFn(latlon, html) {
  return function() {

    Drupal.Geolocation.maps[0].panTo(latlon);
    Drupal.Geolocation.maps[0].setZoom(16);
    Drupal.Geolocation.maps[0].closePopup();

    popup = new L.Popup();

    popup.setLatLng(latlon);
    popup.setContent(html);

    Drupal.Geolocation.maps[0].openPopup(popup);
  };
}
