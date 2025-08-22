import React from "react";

import type { JSX as Jsx } from "preact/jsx-runtime";

declare global {
  namespace JSX {
    type ElementClass = Jsx.ElementClass;
    type Element = Jsx.Element;
    type IntrinsicElements = Jsx.IntrinsicElements;
    type TagName = keyof JSX.IntrinsicElements | React.ElementType<any>;
  }
}
