import { cn } from '@/lib/utils';
const TOP = {
  none: '',
  sm: 'pt-4 sm:pt-5 lg:pt-6',
  md: 'pt-6 sm:pt-7 lg:pt-8',
};

const BOTTOM = {
  none: '',
  sm: 'pb-5 sm:pb-7 lg:pb-10',
  md: 'pb-8 sm:pb-10 lg:pb-12',
};

export function PageContainer({ as: Tag = 'div', top = 'sm', bottom = 'md', className, children }) {
  return (
    <Tag className={cn('mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8', TOP[top], BOTTOM[bottom], className)}>
      {children}
    </Tag>
  );
}
