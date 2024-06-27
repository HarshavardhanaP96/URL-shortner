import express, {Request, Response} from 'express';
import mongoose,{Document, Schema} from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as process from 'process';

const app= express();

app.listen(5000,()=>{
    console.log('listening at port 5000');
    
})


interface IURL extends Document{
    originalUrl:string,
    customHash:{type:string, unique:true}
}

const urlSchema = new mongoose.Schema<IURL>({
    originalUrl:{type:String,required:true},
    customHash:{type:String, required:true, unique:true}
})

const URL=mongoose.model<IURL>('URL',urlSchema)

const mongoURI=process.env.MONGODB_URI as string;

mongoose.connect(mongoURI)
.then(()=>console.log('connected to the db'))
.catch((error:string)=>console.error('mongo db connection error:',error))

app.use(bodyParser.json())
app.use(cors({
    origin: 'https://url-shortner-pi-eight.vercel.app'
}))

function customHash(url:string):string {
    let hash=0;
    for(let i=0;i<url.length;i++){
        const char=url.charCodeAt(i);
        hash= (hash<<5)-hash+char;
        hash= hash & hash;
    }
    return Math.abs(hash).toString(36);
}


//unique hash creater
async function generateUniqueHash(url:string):Promise<string>{
    let hash =customHash(url);
    let counter=0;

    while (await URL.findOne({customHash:hash})){
        counter++;
        hash=customHash(url+counter);
    }
    return hash;
}

app.post('/shorten',async(req:Request,res:Response)=>{
    const {inputUrl, customHash:userHash}=req.body;
    console.log('request received to shorten the url:',inputUrl);
    const originalUrl=inputUrl.trim()

    try{

        const existingUrl=await URL.findOne({originalUrl});
        if(existingUrl){
            const host=req.get('host');
            const protocol=req.protocol;

            const shortUrl = `${protocol}://${host}/${existingUrl.customHash}`;
            console.log('Original URL exist. Returning shorturl:',shortUrl);
            
            return res.json({"shortUrl":shortUrl});
        }

        let Hash
        if(userHash.trim()!=''){
            Hash=userHash.trim();
        }else{
            Hash=await generateUniqueHash(originalUrl);
        }

        const newURL = new URL({originalUrl, customHash:Hash});
        newURL.save();
        console.log('saved new url to the databse');
        

        const host=req.get('host');
        const protocol=req.protocol;

        const shortUrl = `${protocol}://${host}/${Hash}`;
        console.log('returning new short url:',shortUrl);
        return res.json(shortUrl);

    } catch{
        res.status(400).json('custom hash already taken try other')
    }
})

app.get('/:customHash', async(req:Request, res:Response)=>{
    const {customHash}=req.params;

    try{
        const url = await URL.findOne({customHash})
        if(url){
            console.log('url found redirecting to original url:',url.originalUrl);
            
            res.redirect(url.originalUrl);
        }
        res.status(400).json({error:'URL Not Found'})
    }catch{
        res.status(500).json({error:'server error'})
    }
})