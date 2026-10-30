import {useEffect,useState} from "react";

const useFetch = (apiFunction)=>{

const [data,setData]=useState([]);
const [loading,setLoading]=useState(true);
const [error,setError]=useState(null);


useEffect(()=>{

apiFunction()
.then((res)=>{
    setData(res.data);
})
.catch((err)=>{
    setError(err);
})
.finally(()=>{
    setLoading(false);
});


},[apiFunction]);


return {data,loading,error};

}

export default useFetch;
