import useHomes from "../../hooks/useHomes";
import NavBar from "../partials/NavBar";

function HomeListPage(){

const {data:registeredHomes,loading}=useHomes();


if(loading){
 return <h1>Loading...</h1>
}


return(
<>
<NavBar/>

{
registeredHomes.map((home)=>(

<div key={home._id}>

<h2>{home.houseName}</h2>
<p>{home.location}</p>

</div>

))

}

</>
)

}

export default HomeListPage;