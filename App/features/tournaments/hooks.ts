import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
export function useTournaments(){
  return useQuery({
    queryKey:['tournaments'],
    queryFn:async()=>{
      const {data,error}=await supabase.from('tournaments').select('id,name,description,start_date,end_date,location,type').order('start_date',{ascending:true});
      if(error) throw error; return data as any[];
    }
  });
}
