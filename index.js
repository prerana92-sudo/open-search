const AWS = require('aws-sdk');

var region = 'ap-northeast';
var domain = process.env.DOMAIN_URL; 
var index = 'demo_data';
var api_type = '_search';

const searchDocument = async (key) => {
    try {

        let query = {
            "size": 25,
            "query": {
                "multi_match": {
                    "query": key,
                    "fields": ["Title^4", "Plot^2", "Cast"]
                }
            }
        };
        
        var endpoint = new AWS.Endpoint(domain); 
        var request = new AWS.HttpRequest(endpoint, region);
        request.method = 'POST';  
        request.path += index + '/' + api_type + '/';
        request.body = JSON.stringify(query);
        request.headers['host'] = domain;
        request.headers['Content-Type'] = 'application/json';
        request.headers['Content-Length'] = Buffer.byteLength(request.body);

        console.log('OpenSearch Request: ', { request });


        
        var credentials = new AWS.EnvironmentCredentials('AWS');
        var signer = new AWS.Signers.V4(request, 'es');
        signer.addAuthorization(credentials, new Date());

        
        var client = new AWS.HttpClient();
        return new Promise((resolve, reject) => {
            client.handleRequest(
                request,
                null,
                function (response) {
                    console.log(response.statusCode + ' ' + response.statusMessage);
                    var responseBody = '';
                    response.on('data', function (chunk) {
                        responseBody += chunk;
                    });
                    response.on('end', function (chunk) {
                        console.log('Response body: ' + responseBody);
                        resolve(responseBody);
                    });
                },
                function (error) {
                    console.log('Error: ' + error);
                    reject(error);
                }
            );
        });
    } catch (err) {
        console.log(err);
    }
};

exports.handler = async (event) => {

    console.log("Event: ", JSON.stringify(event));

    const key = event.queryStringParameters.key;
    console.log("key", key);


    let res = await searchDocument(key);
    console.log("Results Fetched..........");
    res = JSON.parse(res);

    
    let records = [];
    res.hits.hits.forEach(data => {
        records.push(data._source);
    });

    
    const response = {
        statusCode: 200,
        body: JSON.stringify(records)
    };
    return response;

};
