import { View, Text, TextInput } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useMatchDraft } from '@/lib/state/useMatchDraft';

export function StepPlayers({onPrev,onNext}:{onPrev:()=>void;onNext:()=>void}){
  const {draft,setField}=useMatchDraft();
  const setVal=(team:1|2,idx:number,val:string)=>{
    const key=team===1?'team1':'team2'; const arr=[...(draft as any)[key]]; arr[idx]=val.trim(); setField(key as any,arr);
  };
  const size=draft.matchType==='doubles'?2:1;
  return (
    <View className="flex-1 p-4 gap-3">
      <Text className="text-white text-lg font-semibold">2. Enter player UUIDs</Text>
      {[...Array(size)].map((_,i)=>(
        <View key={'t1-'+i} className="mb-2">
          <Text className="text-white/80">Team 1 – Player {i+1}</Text>
          <TextInput className="bg-white/10 text-white rounded px-3 py-2" autoCapitalize="none" autoCorrect={false}
                     onChangeText={(t)=>setVal(1,i,t)} value={draft.team1[i]||''}/>
        </View>
      ))}
      {[...Array(size)].map((_,i)=>(
        <View key={'t2-'+i} className="mb-2">
          <Text className="text-white/80">Team 2 – Player {i+1}</Text>
          <TextInput className="bg-white/10 text-white rounded px-3 py-2" autoCapitalize="none" autoCorrect={false}
                     onChangeText={(t)=>setVal(2,i,t)} value={draft.team2[i]||''}/>
        </View>
      ))}
      <View className="flex-row gap-2 mt-4">
        <Button title="Back" onPress={onPrev}/><Button title="Next" onPress={onNext}/>
      </View>
    </View>
  );
}
