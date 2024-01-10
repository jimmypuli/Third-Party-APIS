const fs = require('fs'); 
const http = require('http');
const https = require('https'); 
const { fileURLToPath } = require('url');

const port = 3000; 

const server = http.createServer(); 
server.on("request", request_handler); 
server.on('listening', listen_handler); 
server.listen(port); 

function listen_handler(){
    console.log(`Now listening on port ${port}`); 
}

function request_handler(req, res){
    console.log(req.url); 
    if(req.url === "/"){
        const homePage = fs.createReadStream("index.html");
        res.writeHead(200, {"Content-Type" : "text/html"}); 
        homePage.pipe(res); 
    }else if(req.url.startsWith("/search")){
        const rickApi = https.request("https://rickandmortyapi.com/api/character"); 
        rickApi.on("response",(rick_Res) => process_stream(rick_Res, parse_results, res));
        rickApi.end();
    }else{
        res.writeHead(200, {"Content-Type" : "text/html"}); 
        res.end("<h1>404 Nothing found...</h1>");
    }
}


function process_stream(stream, callback, ...args){
    let body = ""; 
    stream.on("data", chunk => body += chunk); 
    stream.on("end", () => callback(body, ...args)); 
}

function parse_results(data, res){
    const lookup = JSON.parse(data); 
    res.writeHead(200, {"Content-Type": "text/html"}); 
    var randNum = Math.floor(Math.random() * (20 - 0) + 0);
    let imageURL = lookup?.results[randNum]?.image;
    let  results = `<h1>${imageURL}</h1>`
    res.write(results);
    downloadImageFromLink(imageURL, res)
}



function downloadImageFromLink(link, http2){
    const imageUrl = `${link}`;
    console.log("image link " + link);
    const imageName = 'image.jpg';

    const file = fs.createWriteStream(imageName);

    https.get(imageUrl, response => {
    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log(`Image downloaded as ${imageName}`);
         lookForFace(http2);
    });
    }).on('error', err => {
        fs.unlink(imageName);
        console.error(`Error downloading image: ${err.message}`);
    });
}


function lookForFace(httpRESPONSE){
    var imageFilePath = 'image.jpg'
    var imageFile = Buffer.from(fs.readFileSync(imageFilePath).buffer);
    
    const options = {
      method: "POST",
      hostname: "testapi.cloudmersive.com",
      path: "/image/face/locate",
      headers: {
        "Apikey": "a3795239-424e-45d8-bdbe-d9fbb958d633",
        "content-type": "multipart/form-data"
      }
    };
    
    
    const req = https.request(options, function (res) {
        let body = "";
        res.on("data", chunk => body += chunk);
      
      res.on("end", function () {
        var lookup = JSON.parse(body); 
        console.log(lookup);
        httpRESPONSE.end(body);
      });
    });   
     req.write(imageFile);
     req.end();  
}
  