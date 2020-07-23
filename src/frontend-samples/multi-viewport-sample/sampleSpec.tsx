/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SampleSpec } from "../../Components/SampleShowcase/SampleShowcase";
import MultiViewportApp from "./MultiViewportApp";

export function getMultiViewportSpec(): SampleSpec {
  return ({
    name: "multi-viewport-sample",
    label: "3d",
    image: "viewport-only-thumbnail.png", // TODO: get real screenshot
    files: [
      { name: "MultiViewportApp.tsx", import: import("!!raw-loader!./MultiViewportApp"), entry: true },
      { name: "MultiViewportUI.tsx", import: import("!!raw-loader!./MultiViewportUI") },
    ],
    setup: MultiViewportApp.setup,
  });
}
