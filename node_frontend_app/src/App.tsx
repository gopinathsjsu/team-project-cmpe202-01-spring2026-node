import { useState } from 'react'
import './App.css'

function App() {

  const [searchQuery, setSearchQuery] = useState('');

  const searchEvents = () => {
    console.log(searchQuery);

    // GO to Events Page:  and use api : /api/events?searchQuery=searchQuery

  }

  return (
    <>
      <div>
        <h1>Node</h1>

      </div>
      <div className="card">
        Discover events around you
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events" />
        <button onClick={() => searchEvents()}>Search</button>
      </div>
      <p className="read-the-docs">

      </p>
    </>
  )
}

export default App
