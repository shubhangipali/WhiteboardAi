import * as React from 'react';
// Augment react-konva types to include children on Stage (and other components if needed).
// Some react-konva prop types don't include React's implicit `children` property which
// causes TypeScript errors when using JSX children inside <Stage>.
declare module 'react-konva' {
  // Merge into existing StageProps interface (if present) to allow children.
  interface StageProps extends React.PropsWithChildren<any> {}
}
