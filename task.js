const {MongoClient} = require('mongodb')
const express = require("express");
const app = express();
const cors = require("cors");
const url = require('url');
const querystring = require('querystring');


const PORT = process.env.PORT || 8080;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())


const uri = "mongodb+srv://sammam:1234@cluster0.hmph7av.mongodb.net/?retryWrites=true&w=majority"
global.client = new MongoClient(uri);


try{
    client.connect()
    console.log("Connected to mongodb")
}
catch(e){
    console.log(e)
}



function toRad(Value) {
    return Value * Math.PI / 180;
}

const calc = function(x1,y1,x2,y2){

        y1 = toRad(y1);
        y2 = toRad(y2);
        x1 = toRad(x1);
        x2 = toRad(x2);
 
     
        let dlon = y2 - y1;
        let dlat = x2 - x1;
        let a = Math.pow(Math.sin(dlat / 2), 2)
                 + Math.cos(x1) * Math.cos(x2)
                 * Math.pow(Math.sin(dlon / 2),2);
             
        let c = 2 * Math.asin(Math.sqrt(a));
        let r = 6371;
 
        return c * r;
   
}


async function find(lat,long,radius,sort){

    var res
    let a = lat
    let b = long

    try{
    res = await client.db("Library").collection("Cities").aggregate( [ 
        { $project : { _id : 0 ,name : 1 , lat : 1, long : 1} } 
    ] ).toArray()
    }

    catch(e){
        console.log(e)
    }

    let filtered = []
    let x = res.map((row) => {

        distance = calc(a,b,row.lat,row.long)
       
        if (distance <= radius){
            row.distance = distance
            filtered.push(row)
        }

    })
    
    filtered.sort((a, b) => {

        if (sort === 'distance'){
        return a.distance - b.distance;
        }

        else{
            return a.name - b.name;
        }

    });
    
    console.log(filtered)
    return filtered
    
}


app.get("/suggestions", async (req, res) => {

    got_url = req.url

    let parsedUrl = url.parse(got_url);
    let parame = querystring.parse(parsedUrl.query);

    parame.radius = parseInt(parame.radius)
    parame.latitude = parseFloat(parame.latitude)
    parame.longitude = parseFloat(parame.longitude)

    
    
    sugg = {suggestions : await find(parame.latitude,parame.longitude,parame.radius,parame.sort)}

    res.send(sugg)
})

