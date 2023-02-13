import axios from 'axios';
import { useQuery } from 'react-query';

export interface UseTagsResultInterface {
  label: string;
  isEnabled: string;
  id: string;
  count: number;
}
export default function useTags() {
  return useQuery<UseTagsResultInterface[]>('get-tags', () =>
    axios.get('/api/tags').then(res =>
      res.data.data.map(tag => ({
        label: tag.label,
        isEnabled: tag.isEnabled,
        id: tag.id,
        count: tag._count.CollectionTag,
      })),
    ),
  );
}
