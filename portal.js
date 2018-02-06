
//Author : Hussein Nasser
//Date   : Jan-23-2018
//Twitter: @hnasr

    class Portal{
        
        constructor(url, username, password)
        {
            this.url = url;
            this.username = username;
            this.password = password;
        }

        connect()
        {
            let tokenUrl = this.url + "/sharing/rest/generateToken";
        
            let token = null;
            let postJson = {
                username: this.username,
                password: this.password,
                referer: window.location.host,
                expiration: 60,
                f: "json"
            }
            
            return new Promise((resolve, reject) => makeRequest({method: 'POST', url: tokenUrl, params: postJson }).then(response=> 
                 {
                      if (response.token !== undefined)
                      {
                        this.token = response.token; 
                        resolve(this.token);
                       }
                     else
                      reject("Invalid token")
                 } ).catch(rejected=>reject("Fail to execute request")));
        }

      

        items()
        {
            return new Promise( (resolve, reject) => {

                    let userItemsUrl = this.url + "/sharing/rest/search";
                    let postJson = {
                        token: this.token,
                        num : 100,
                        q : "owner:" + this.username,
                        f : "json"
                    }

                    makeRequest({method: 'POST', url: userItemsUrl, params: postJson }).then(response => {  
                        let myItems =  response;
                        resolve(myItems.results);
                      })

            })

        }




        loadItem (itemId)
        {  
            let itemUrl = this.url + "/sharing/rest/content/items/" + itemId + "/data";
            let postJson = {
                token: this.token,
                f: "json"
            }
 
           return makeRequest({method: 'POST', url: itemUrl , params : postJson })
            
        }
    }