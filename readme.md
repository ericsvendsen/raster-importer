#Raster Importer
App for importing raster images into geoserver

##Usage
    curl --form "file=@[PATH-TO-FILE]" http://[SERVER-LOCATION]:[PORT]/importraster
* Replace [PATH-TO-FILE] with the location of your file
* Replace [SERVER-LOCATION] with the IP or domain name path or your server (can be localhost or 127.0.0.1 if running locally)
* Replace [PORT] with 9000 (if accessing node process directly) or another value (if node is running behind a reverse proxy)