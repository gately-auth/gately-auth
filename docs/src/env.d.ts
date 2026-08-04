/// <reference path="../.astro/types.d.ts" />

declare namespace JSX {
  interface IntrinsicElements {
    'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      icon?: string;
      width?: number | string;
      height?: number | string;
    };
  }
}