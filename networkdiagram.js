
    class Diagram{

        constructor(token, url)
        {
            this.url = url  + "/" + "NetworkDiagramServer";
            this.token = token;
            this.diagramsUrl = this.url + "/diagrams";
            this.dynamicLayerUrl = url  + "/FeatureServer/dynamicLayer";
        }

        extend(type, name)
        {
          var extType = "";
          if (type == 0)
          {
            extType = "esriDiagramExtendByConnectivity";
          }
          else if (type == 1)
          {
            extType = "esriDiagramExtendByTraversability";
          }
          else if (type == 2)
          {
            extType = "esriDiagramExtendByAttachment";
          }
          else if (type == 3)
          {
            extType = "esriDiagramExtendByContainment";
          }
          else
          {
            extendType: ""
          }
            let diagramsUrl = this.url + "/diagrams/" + name + "/extend";
            let postJson = {
                token: this.token,
                extendType: extType,
                f: "json"
            }
            return makeRequest({method: 'POST', url: diagramsUrl, params: postJson});
        }

        getDiagrams()
        {
            let diagramsUrl = this.url + "/diagrams";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: diagramsUrl, params: postJson});
        }

        getDiagramTemplates()
        {
            let templatesUrl = this.url + "/templates";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: templatesUrl, params: postJson});
        }

        getDiagramTemplateInfo(templateName)
        {
            let templateInfoUrl = this.url + "/templates/" + templateName;
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: templateInfoUrl, params: postJson});
        }

        getDiagramMap(name)
        {
            let diagramsUrl = this.diagramsUrl + "/" + name + "/map";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: diagramsUrl, params: postJson});
        }

        getDynamicLayers(diagramName)
        {
            let dynamicLayersUrl = this.diagramsUrl + "/" + diagramName + "/dynamicLayers";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: dynamicLayersUrl, params: postJson});
        }

        getLayerDefinitions(diagramName)
        {
            let layerDefinitionsUrl = this.diagramsUrl + "/" + diagramName + "/layerDefinitions";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: layerDefinitionsUrl, params: postJson});
        }

        getDiagramMap(diagramName)
        {
            let mapUrl = this.diagramsUrl + "/" + diagramName + "/map";
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: mapUrl, params: postJson});
        }

        getDiagramMapUrl(diagramName)
        {
            return this.diagramsUrl + "/" + diagramName + "/map";
        }

        getDiagram(diagramName)
        {
            let dgUrl = this.diagramsUrl + "/" + diagramName;
            let postJson = {
                token: this.token,
                f: "json"
            }
            return makeRequest({method: 'POST', url: dgUrl, params: postJson});
        }

        queryLayer(layer)
        {
          //Use feature server!!
          let dynamicLayersUrl = this.dynamicLayerUrl + "/query"
          let postJson = {
              token: this.token,
              returnGeometry : true,
              where : "1=1",
              layer : layer,
              geometryType : "esriGeometryEnvelope",
              spatialRel: "esriSpatialRelIntersects",
              f: "json"
          }
          return makeRequest({method: 'POST', url: dynamicLayersUrl, params: postJson});
        }

        queryDiagramElemntByExtent(diagramName, resultExtent)
        {
          let queryDiagramElemntByExtentUrl = this.diagramsUrl + "/" + diagramName + "/queryDiagramElementsByExtent";
          let postJson = {
              token: this.token,
              returnGeometry : true,
              extent : resultExtent,
              addContents : true,
              returnJunctions : true,
              returnEdges: true,
              returnContainers: true,
              returnGeometry: true,
              f: "json"
          }
          return makeRequest({method: 'POST', url: queryDiagramElemntByExtentUrl, params: postJson});
        }

        cloneTemporaryDiagram(resultInitialFeatures, type)
        {
          let cloneTemporaryDiagramUrl = this.url + "/" + "createDiagramFromFeatures";
          let postJson = {
              token: this.token,
              template : type,
              initialFeatures: resultInitialFeatures,
              f: "json"
          }
          return makeRequest({method: 'POST', url: cloneTemporaryDiagramUrl, params: postJson});
        }

        applyForceDirected(diagramName, contFeatures, junctionFeatures, edgesFeatures)
        {
          let applyForceDirectedLayoutUrl = this.diagramsUrl + "/" + diagramName  + "/applyLayout";
          let postJson = {
              token: this.token,
              //layoutParams: "{\"type\": \"PropertySet\",\"propertySetItems\": [\"are_containers_preserved\", false, \"is_active\", false, \"iterations_number\", 20, \"repel_factor\", 1, \"degree_freedom\", 1]}",
              layoutName : "ForceDirectedDiagramLayout",
              containerObjectIDs: [],//contFeatures,
              junctionObjectIDs: [],//junctionFeatures,
              edgeObjectIDs:[],// edgesFeatures,
              f: "json"
          }
          return makeRequest({method: 'POST', url: applyForceDirectedLayoutUrl, params: postJson});
        }

        applyLayoutAlgorithm(algorithmName, diagramName, contFeatures, junctionFeatures, edgesFeatures, layoutParams)
        {
          let applyForceDirectedLayoutUrl = this.diagramsUrl + "/" + diagramName  + "/applyLayout";
          let postJson = {
              token: this.token,
              layoutParams : layoutParams,
              layoutName : algorithmName,
              containerObjectIDs: contFeatures,
              junctionObjectIDs: junctionFeatures,
              edgeObjectIDs:edgesFeatures,
              f: "json"
          }
          return makeRequest({method: 'POST', url: applyForceDirectedLayoutUrl, params: postJson});
        }

        storeDiagram(diagramName, newName, tagStored)
        {
          let storeUrl = this.diagramsUrl + "/" + diagramName  + "/store";
          let postJson = {
              token: this.token,
              name : newName,
              tag: tagStored,
              access: "esriDiagramPublicAccess",
              f: "json"
          }
          return makeRequest({method: 'POST', url: storeUrl, params: postJson});
        }

        updateDiagram(diagramName)
        {
          let updateUrl = this.diagramsUrl + "/" + diagramName  + "/update";
          let postJson = {
              token: this.token,
              f: "json"
          }
          return makeRequest({method: 'POST', url: updateUrl, params: postJson});
        }
    }
