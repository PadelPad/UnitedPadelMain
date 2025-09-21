import { expected } from '@/lib/utils/elo'; test('symmetry',()=>{expect(expected(1200,1200)).toBeCloseTo(0.5);});
