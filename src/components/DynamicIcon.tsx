import React from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  LayoutGrid,
  RotateCw,
  FileImage,
  Images,
  PenTool,
  ScanText,
  Stamp,
  Hash,
  Lock,
  Unlock,
  ShieldAlert,
  Crop,
  Scaling,
  FolderDown,
  FileCog,
  FileText,
  LucideProps,
} from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Layers':
      return <Layers {...props} />;
    case 'Scissors':
      return <Scissors {...props} />;
    case 'Minimize2':
      return <Minimize2 {...props} />;
    case 'LayoutGrid':
      return <LayoutGrid {...props} />;
    case 'RotateCw':
      return <RotateCw {...props} />;
    case 'FileImage':
      return <FileImage {...props} />;
    case 'Images':
      return <Images {...props} />;
    case 'PenTool':
      return <PenTool {...props} />;
    case 'ScanText':
      return <ScanText {...props} />;
    case 'Stamp':
      return <Stamp {...props} />;
    case 'Hash':
      return <Hash {...props} />;
    case 'Lock':
      return <Lock {...props} />;
    case 'Unlock':
      return <Unlock {...props} />;
    case 'ShieldAlert':
      return <ShieldAlert {...props} />;
    case 'Crop':
      return <Crop {...props} />;
    case 'Scaling':
      return <Scaling {...props} />;
    case 'FolderDown':
      return <FolderDown {...props} />;
    case 'FileCog':
      return <FileCog {...props} />;
    default:
      return <FileText {...props} />;
  }
};
