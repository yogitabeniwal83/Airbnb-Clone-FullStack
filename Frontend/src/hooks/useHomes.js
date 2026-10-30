import { useCallback } from "react";
import api from "../api/axios";

import useFetch from "./useFetch";


const useHomes = ()=>{
const fetchHomes = useCallback(() => api.get("/homes"), []);

return useFetch(fetchHomes);

}


export default useHomes;
