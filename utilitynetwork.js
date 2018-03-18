'use strict';
//Author : Hussein Nasser
//Date   : Jan-23-2018
//Twitter: @hnasr
const emptyTraceConfiguration = {"includeContainers":false,"includeContent":false,"includeStructures":false,"includeBarriers":true,"validateConsistency":false,"domainNetworkName":"","tierName":"","targetTierName":"","subnetworkName":"","diagramTemplateName":"","shortestPathNetworkAttributeName":"","filterBitsetNetworkAttributeName":"","traversabilityScope":"junctionsAndEdges","conditionBarriers":[],"functionBarriers":[],"arcadeExpressionBarrier":"","filterBarriers":[],"filterFunctionBarriers":[],"filterScope":"junctionsAndEdges","functions":[],"nearestNeighbor":{"count":-1,"costNetworkAttributeName":"","nearestCategories":[],"nearestAssets":[]},"outputFilters":[],"outputConditions":[],"propagators":[]}
 
class UtilityNetwork {

        constructor(token, featureServiceUrl)
        {   

            this.featureServiceUrl = featureServiceUrl;
            this.token = token;          
        }

      ///first function one should call after creating an instance of a utility network
       load ()
        {
            let thisObj = this;
            return new Promise (function (resolve, reject)
            {
                //run async mode
                (async function () {    
                //pull the feature service definition
                let featureServiceJsonResult = await makeRequest({method: 'POST', url: thisObj.featureServiceUrl, params: {f : "json", token: thisObj.token}});
                thisObj.featureServiceJson = featureServiceJsonResult
                //check to see if the feature service has a UN
                if (thisObj.featureServiceJson.controllerDatasetLayers != undefined)
                {   
                    thisObj.layerId = thisObj.featureServiceJson.controllerDatasetLayers.utilityNetworkLayerId;
                    let queryDataElementUrl = thisObj.featureServiceUrl + "/queryDataElements";
                    let layers = "["  + thisObj.layerId + "]"
                
                    let postJson = {
                        token: thisObj.token,
                        layers: layers,
                        f: "json"
                    }
                    //pull the data element definition of the utility network now that we have the utility network layer
                    let undataElement = await makeRequest({method: 'POST', url: queryDataElementUrl, params: postJson });
                    
                    //request the un layer defition which has different set of information
                    let unLayerUrl = thisObj.featureServiceUrl + "/" + thisObj.layerId;
                    postJson = {
                        token: thisObj.token,
                        f: "json"
                    }
                    let unLayerDef = await makeRequest({method: 'POST', url: unLayerUrl, params: postJson });
            
                    thisObj.dataElement = undataElement.layerDataElements[0].dataElement;
                    thisObj.layerDefinition = unLayerDef
                    thisObj.subnetLineLayerId = thisObj.getSubnetLineLayerId();                    
                    resolve(thisObj);
                }
                else
                    reject("No Utility Network found in this feature service");

                     
            })();
                })

       
            }

            
        //return the domainNetwork object.     
        getDomainNetwork(domainNetworkName)
        {
          
            for (let domainNetwork of this.dataElement.domainNetworks)
               if (domainNetwork.domainNetworkName === domainNetworkName) return domainNetwork;
       
        }
        //return the tier
        getTier(domainNetworkName, tierName)
        {
            for (let tier of this.getDomainNetwork(domainNetworkName).tiers)
              if (tier.name === tierName) 
               return tier;
        }
        //query the subnetwokrs table 
        getSubnetworks(domainNetworkName, tierName)
        {
            let subnetworkTableUrl = this.featureServiceUrl + "/" + this.layerDefinition.systemLayers.subnetworksTableId + "/query";
            
            let postJson = {
                token: this.token,
                where: "DOMAINNETWORKNAME = '" + domainNetworkName + "' AND TIERNAME = '" + tierName + "'",
                outFields: "SUBNETWORKNAME",
                orderByFields: "SUBNETWORKNAME",
                returnDistinctValues: true,
                f: "json"
            }

            return makeRequest({method: 'POST', url: subnetworkTableUrl, params: postJson});

        }

        //query that projects to webmercator. 
        query(layerId, where, obj, objectids)
        {   
            let webMercSpatialReference = {
                "wkid": 102100,
                "latestWkid": 3857,
                "xyTolerance": 0.001,
                "zTolerance": 0.001,
                "mTolerance": 0.001,
                "falseX": -20037700,
                "falseY": -30241100,
                "xyUnits": 148923141.92838538,
                "falseZ": -100000,
                "zUnits": 10000,
                "falseM": -100000,
                "mUnits": 10000
                }

            let queryJson = {
                f: "json",
                token: this.token,
                outFields: "*",
                where: where,
                outSR: JSON.stringify(webMercSpatialReference)
            }

            if (objectids != undefined) 
            queryJson.objectIds = objectids;
            queryJson.layerId = layerId
            return new Promise((resolve, reject) => {

                makeRequest({method: 'POST', params: queryJson, url: this.featureServiceUrl + "/" + layerId + "/query"}).then(rowsJson=> {                  
                    rowsJson.obj = obj;
                    resolve(rowsJson);
                }).catch(rej => reject("failed to query"));
                
            });
                
              
        }
        //get the terminal configuration using the id
        getTerminalConfiguration(terminalConfigurationId)
        {
            return this.dataElement.terminalConfigurations.find(tc => tc.terminalConfigurationId === terminalConfigurationId);
        }

        //get the subenetline layer
        getSubnetLineLayerId()
        {

            //esriUNFCUTSubnetLine

            let domainNetworks = this.dataElement.domainNetworks;
            
            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
                //only search edgeSources since subnetline is a line
                for (let j = 0; j < domainNetwork.edgeSources.length; j ++)
                    if (domainNetwork.edgeSources[j].utilityNetworkFeatureClassUsageType === "esriUNFCUTSubnetLine")
                        return domainNetwork.edgeSources[j].layerId;
            }

        }

        //return the asset type 
        getAssetType(layerId, assetGroupCode, assetTypeCode)
        {

            let domainNetworks = this.dataElement.domainNetworks;
            let layerObj = undefined;

            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
                for (let j = 0; j < domainNetwork.junctionSources.length; j ++)
                    if (domainNetwork.junctionSources[j].layerId == layerId)
                    {  
                           let assetGroup = domainNetwork.junctionSources[j].assetGroups.find( ag => ag.assetGroupCode === assetGroupCode);
                           if (assetGroup instanceof Object)
                           {
                             let assetType = assetGroup.assetTypes.find(at => at.assetTypeCode === assetTypeCode);
                             assetType.assetGroupName = assetGroup.assetGroupName;
                             assetType.utilityNetworkFeatureClassUsageType = domainNetwork.junctionSources[j].utilityNetworkFeatureClassUsageType;
                             if(assetType instanceof Object) return assetType;
                           }                          
                    }

                for (let j = 0; j < domainNetwork.edgeSources.length; j ++)
                    if (domainNetwork.edgeSources[j].layerId == layerId)
                    { 
                        let assetGroup = domainNetwork.edgeSources[j].assetGroups.find( ag => ag.assetGroupCode === assetGroupCode);
                        if (assetGroup instanceof Object)
                        {
                          let assetType = assetGroup.assetTypes.find(at => at.assetTypeCode === assetTypeCode);
                          assetType.assetGroupName = assetGroup.assetGroupName;
                          assetType.utilityNetworkFeatureClassUsageType = domainNetwork.edgeSources[j].utilityNetworkFeatureClassUsageType;
                          if(assetType instanceof Object) return assetType;
                        }            
                    }
            }
 
            return undefined; 
        }

        //return layer by type
        getLayer(utilityNetworkUsageType) {

            let domainNetworks = this.dataElement.domainNetworks;
            
            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
              
                for (let j = 0; j < domainNetwork.junctionSources.length; j ++)
                    if (domainNetwork.junctionSources[j].utilityNetworkFeatureClassUsageType === utilityNetworkUsageType)
                        return domainNetwork.junctionSources[j].layerId;
            }

            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
              
                for (let j = 0; j < domainNetwork.edgeSources.length; j ++)
                    if (domainNetwork.edgeSources[j].utilityNetworkFeatureClassUsageType === utilityNetworkUsageType)
                        return domainNetwork.edgeSources[j].layerId;
            }
        }
        //return the first device layer
        getDeviceLayer() {
            
          return this.getLayer("esriUNFCUTDevice");

        }
        //return the first junction layer
        getJunctionLayer() {

            return this.getLayer("esriUNFCUTJunction");
        }
        //return the first Line layer
        getLineLayer() {
            return this.getLayer("esriUNFCUTLine");
        }

        //determines if the layerid is a line or point... 
        isLayerEdge(layerId) {

            let domainNetworks = this.dataElement.domainNetworks;

            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
              
                for (let j = 0; j < domainNetwork.edgeSources.length; j ++)
                    if (domainNetwork.edgeSources[j].layerId === layerId)
                        return true;
            }

            return false;
        }


        //get layer id from Source Id used to map sourceid to layer id
        getLayerIdfromSourceId(sourceId)
        { 
            let domainNetworks = this.dataElement.domainNetworks;
            let layerObj = undefined;

            for (let i = 0; i < domainNetworks.length; i ++)
            {
                let domainNetwork = domainNetworks[i];
                for (let j = 0; j < domainNetwork.junctionSources.length; j ++)
                    if (domainNetwork.junctionSources[j].sourceId == sourceId)
                    {  
                          layerObj =  {type: domainNetwork.junctionSources[j].shapeType, layerId: domainNetwork.junctionSources[j].layerId}
                          break;
                    }

                for (let j = 0; j < domainNetwork.edgeSources.length; j ++)
                    if (domainNetwork.edgeSources[j].sourceId == sourceId)
                    { 
                         layerObj = {type: domainNetwork.edgeSources[j].shapeType, layerId: domainNetwork.edgeSources[j].layerId} 
                         break;
                    }
            }

            if (layerObj != undefined)
                layerObj.type = layerObj.type.replace("esriGeometry", "").toLowerCase();

            return layerObj;
        }

        //receives an array of starting locations and transforms it for the rest params.. 
        buildTraceLocations (traceLocationsParam) {

            let traceLocations = [];
            //terminalId  percentAlong: 0
            //line starting point [{"traceLocationType":"startingPoint","globalId":"{00B313AC-FBC4-4FF4-9D7A-6BF40F4D4CAD}","percentAlong":0.84695770913918678}]
            traceLocationsParam.forEach(s=> {
                //if layerid doesn't exists get it from the sourceid..
                if (s.layerId === undefined) s.layerId = this.getLayerIdfromSourceId(s.networkSourceId);

                if (this.isLayerEdge(s.layerId) === true)
                    traceLocations.push({traceLocationType: s.traceLocationType, globalId:s.globalId , percentAlong: 0.5 } ) //add the starting point to themiddle of the line temporary
                else {
                    //if its a junction, check if a terminalid is passed if not then get the terminal configuration and add all possible terminals temrporary..
                    if (s.terminalId === undefined && s.terminalId != -1) {
                        let at = this.getAssetType(s.layerId, s.assetGroupCode, s.assetTypeCode);
                        let tc = this.getTerminalConfiguration(at.terminalConfigurationId)
                        tc.terminals.forEach(t => traceLocations.push({traceLocationType: s.traceLocationType, globalId:s.globalId , terminalId: t.terminalId } ))                    
                        }
                    else
                    {
                        traceLocations.push({traceLocationType: s.traceLocationType, globalId:s.globalId , terminalId: s.terminalId } )                   
                    }
                }
                   
            }
            );

            return traceLocations;
        }
        
        //run connected Trace
        connectedTrace(traceLocationsParam, traceConfiguration)
        {                      
            return this.Trace(traceLocationsParam, "connected", traceConfiguration);
        }

        //generic trace function
        Trace (traceLocationsParam, traceType, traceConfiguration, forceFail=true) {
            
            let traceLocations = this.buildTraceLocations (traceLocationsParam);
            return new Promise((resolve, reject) => {
                if (traceConfiguration === undefined) 
                    traceConfiguration = emptyTraceConfiguration; //{"includeContainers":false,"includeContent":false,"includeStructures":false,"includeBarriers":true,"validateConsistency":false,"domainNetworkName":"","tierName":"","targetTierName":"","subnetworkName":"","diagramTemplateName":"","shortestPathNetworkAttributeName":"","filterBitsetNetworkAttributeName":"","traversabilityScope":"junctionsAndEdges","conditionBarriers":[],"functionBarriers":[],"arcadeExpressionBarrier":"","filterBarriers":[],"filterFunctionBarriers":[],"filterScope":"junctionsAndEdges","functions":[],"nearestNeighbor":{"count":-1,"costNetworkAttributeName":"","nearestCategories":[],"nearestAssets":[]},"outputFilters":[],"outputConditions":[],"propagators":[]}
 
                //serviceJson load each layer.. 
               let ar = this.featureServiceUrl.split("/");
               ar[ar.length-1]="UtilityNetworkServer";
               let traceUrl = ar.join("/") + "/trace"
                 let traceJson = {
                    f: "json",
                    token: this.token,
                    traceType : traceType,
                    traceLocations: JSON.stringify(traceLocations),
                    traceConfiguration: JSON.stringify(traceConfiguration)
                }
                let un = this;
                makeRequest({method:'POST', params: traceJson, url: traceUrl })
                .then(featuresJson=> featuresJson.success === false && forceFail === true ? reject(JSON.stringify(featuresJson)) : resolve( featuresJson))
                .catch(e=> reject("failed to execute trace. " + e));
 
            });
        }



        subnetworkControllerTrace (traceLocationsParam, domainNetworkName, tierName, subnetworkName, traceConfiguration)  {
 
            
            if (traceConfiguration === undefined)
            {  
  
             let tier = this.getTier(domainNetworkName, tierName);
             let subnetworkDef = tier.updateSubnetworkTraceConfiguration;
             subnetworkDef.subnetworkName = subnetworkName;
             //disable consistency
             subnetworkDef.validateConsistency = false;
             traceConfiguration = subnetworkDef;
             //if no trace configuration passed to override use the tier subnetwork definition
           }

            return this.Trace(traceLocationsParam, "subnetworkController", traceConfiguration,false);
            
        }

        upstreamTrace (traceLocationsParam, domainNetworkName, tierName, subnetworkName, traceConfiguration) {

            
            if (traceConfiguration === undefined)
            {  
  
             let tier = this.getTier(domainNetworkName, tierName);
             let subnetworkDef = tier.updateSubnetworkTraceConfiguration;
             subnetworkDef.subnetworkName = subnetworkName;
             //disable consistency
             subnetworkDef.validateConsistency = false;
             traceConfiguration = subnetworkDef;
             //if no trace configuration passed to override use the tier subnetwork definition
           }
              

            return this.Trace(traceLocationsParam, "upstream", traceConfiguration);
        }


        downstreamTrace (traceLocationsParam, domainNetworkName, tierName, subnetworkName, traceConfiguration) {

            
            
            if (traceConfiguration === undefined)
            {  
  
             let tier = this.getTier(domainNetworkName, tierName);
             let subnetworkDef = tier.updateSubnetworkTraceConfiguration;
             subnetworkDef.subnetworkName = subnetworkName;
             //disable consistency
             subnetworkDef.validateConsistency = false;
             traceConfiguration = subnetworkDef;
             //if no trace configuration passed to override use the tier subnetwork definition
           }

                       
            return this.Trace(traceLocationsParam, "downstream", traceConfiguration);
        }

        //run subnetwork Trace
        subnetworkTrace(traceLocationsParam, domainNetworkName, tierName, subnetworkName, traceConfiguration)
        {   

            if (traceConfiguration === undefined)
            {  
  
             let tier = this.getTier(domainNetworkName, tierName);
             let subnetworkDef = tier.updateSubnetworkTraceConfiguration;
             subnetworkDef.subnetworkName = subnetworkName;
             //disable consistency
             subnetworkDef.validateConsistency = false;
             traceConfiguration = subnetworkDef;
             //if no trace configuration passed to override use the tier subnetwork definition
           }

            return this.Trace(traceLocationsParam, "subnetwork", traceConfiguration);
             
        }


    }

 
     //Makes a request
      function makeRequest (opts) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
                
            xhr.open(opts.method, opts.url);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                let jsonRes = xhr.response;
                if (typeof jsonRes !== "object") jsonRes = JSON.parse(xhr.response);
                resolve(jsonRes);
            } else {
                reject({
                status: this.status,
                statusText: xhr.statusText
                });
            }
        };

        //xhr.onerror =   err => reject({status: this.status, statusText: xhr.statusText}) ;
        xhr.onerror =   err => reject(err) ;
        

        if (opts.headers) 
        Object.keys(opts.headers).forEach(  key => xhr.setRequestHeader(key, opts.headers[key]) )

        let params = opts.params;
        // We'll need to stringify if we've been given an object
        // If we have a string, this is skipped.
        if (params && typeof params === 'object') 
            params = Object.keys(params).map(key =>  encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&');
        
        xhr.send(params);
  });
}