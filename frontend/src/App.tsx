import { useState } from 'react'
import axios from 'axios';
import './App.css'

function App() {
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [customHash, setCustomHash]=useState<string>('');
  const [shortUrl, setShortUrl]=useState<string>('');

  const handleSubmit=(async(e:React.FormEvent)=>{
    e.preventDefault();
    try{
      const response =await axios.post('http://localhost:5000/shorten',{originalUrl,customHash})
      setShortUrl(response.data.shortUrl);
    }catch(error){
      console.log('Error in creating the short url:',error);
      
    }
  })

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>URL Shortner</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" 
            placeholder='Enter Original Url' 
            value={originalUrl} 
            onChange={(e)=>setOriginalUrl(e.target.value)} 
            required 
          />
          <input type="text" 
            placeholder='Enter custom Hash (optional' 
            value={customHash} 
            onChange={(e)=>setCustomHash(e.target.value)}  
          />
          <button type='submit'>Shorten</button>
          {shortUrl &&(
            <div>
              <h2>Shortend URL:</h2>
              <a href={shortUrl} target='_blank' rel='noopener noreferrer'>{shortUrl}</a>
            </div>
          )}
        </form>
      </header>

    </div>
  )
}

export default App
