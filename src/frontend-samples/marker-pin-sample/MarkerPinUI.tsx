/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "common/samples-common.scss";
import { Point3d, Range2d } from "@bentley/geometry-core";
import { IModelApp, IModelConnection, ScreenViewport, StandardViewId, ViewState } from "@bentley/imodeljs-frontend";
import { Button, ButtonType, Toggle } from "@bentley/ui-core";
import { PlaceMarkerTool } from "./PlaceMarkerTool";
import { PopupMenu } from "./PopupMenu";
import { RadioCard, RadioCardEntry } from "./RadioCard/RadioCard";
import { PointSelector } from "common/PointSelector/PointSelector";
import { ReloadableViewport } from "Components/Viewport/ReloadableViewport";
import { ViewSetup } from "api/viewSetup";
import MarkerPinApp from "./MarkerPinApp";

interface ManualPinSelection {
  name: string;
  image: string;
}

interface MarkerPinsUIState {
  imodel?: IModelConnection;
  showDecorator: boolean;
  manualPin: ManualPinSelection;
}

export default class MarkerPinsUI extends React.Component<{
  iModelName: string, setupControlPane: (instructions: string, controls?: React.ReactNode) => void;
}, MarkerPinsUIState> {

  /** Creates a Sample instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      showDecorator: true,
      manualPin: MarkerPinsUI.getManualPinSelections()[0],
    };
  }

  /** This callback will be executed when the user interacts with the PointSelector
   * UI component.  It is also called once when the component initializes.
   */
  private _onPointsChanged = async (points: Point3d[]): Promise<void> => {

    for (const point of points)
      point.z = MarkerPinApp.height!;

    if (!MarkerPinApp.decoratorIsSetup())
      return MarkerPinApp.setupDecorator(points);
    else
      MarkerPinApp.setMarkerPoints(points);
  }

  /** Called when the user changes the showMarkers toggle. */
  private _onChangeShowMarkers = (checked: boolean) => {
    if (checked) {
      this.setState({ showDecorator: true }, () => MarkerPinApp.enableDecorations());
    } else {
      this.setState({ showDecorator: false }, () => MarkerPinApp.disableDecorations());
    }
  }

  /** A static array of pin images. */
  private static getManualPinSelections(): ManualPinSelection[] {
    return (
      [{ image: "Google_Maps_pin.svg", name: "Google Pin" },
      { image: "pin_celery.svg", name: "Celery Pin" },
      { image: "pin_poloblue.svg", name: "Polo blue Pin" }]);
  }

  /** Creates the array which populates the RadioCard UI component */
  private getMarkerList(): RadioCardEntry[] {
    return (MarkerPinsUI.getManualPinSelections().map((entry: ManualPinSelection) => ({ image: entry.image, value: entry.name })));
  }

  /** Called when the user clicks a new option in the RadioCard UI component */
  private _onManualPinChange = (name: string) => {
    const manualPin = MarkerPinsUI.getManualPinSelections().find((entry: ManualPinSelection) => entry.name === name)!;
    this.setState({ manualPin });
  }

  /** This callback will be executed by the PlaceMarkerTool when it is time to create a new marker */
  private _manuallyAddMarker = (point: Point3d) => {
    MarkerPinApp.addMarkerPoint(point, MarkerPinApp._images.get(this.state.manualPin.image)!);
  }

  /** This callback will be executed when the user clicks the UI button.  It will start the tool which
   * handles further user input.
   */
  private _onStartPlaceMarkerTool = () => {
    IModelApp.tools.run(PlaceMarkerTool.toolId, this._manuallyAddMarker);
  }

  /** This callback will be executed by ReloadableViewport to initialize the viewstate */
  public static async getTopView(imodel: IModelConnection): Promise<ViewState> {
    const viewState = await ViewSetup.getDefaultView(imodel);

    // The marker pins look better in a top view
    viewState.setStandardRotation(StandardViewId.Top);

    const range = viewState.computeFitRange();
    const aspect = viewState.getAspectRatio();

    viewState.lookAtVolume(range, aspect);

    return viewState;
  }

  /** This callback will be executed by ReloadableViewport once the iModel has been loaded */
  private onIModelReady = (imodel: IModelConnection) => {
    IModelApp.viewManager.onViewOpen.addOnce((vp: ScreenViewport) => {

      // Grab range of the contents of the view. We'll use this to position the random markers.
      const range = vp.view.computeFitRange();
      MarkerPinApp.range = Range2d.createFrom(range);

      // Grab the max Z for the view contents.  We'll use this as the plane for the auto-generated markers. */
      MarkerPinApp.height = range.zHigh;

      this.setState({ imodel });
    });
  }

  /** Components for rendering the sample's instructions and controls */
  public getControls() {
    return (
      <>
        <PopupMenu />
        <div className="sample-options-2col">
          <span>Show Markers</span>
          <Toggle isOn={this.state.showDecorator} onChange={this._onChangeShowMarkers} />
        </div>
        <hr></hr>
        <div className="sample-heading">
          <span>Auto-generate locations</span>
        </div>
        <div className="sample-options-2col">
          <PointSelector onPointsChanged={this._onPointsChanged} range={MarkerPinApp.range} />
        </div>
        <hr></hr>
        <div className="sample-heading">
          <span>Manual placement</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <RadioCard entries={this.getMarkerList()} selected={this.state.manualPin.name} onChange={this._onManualPinChange} />
          <Button buttonType={ButtonType.Primary} onClick={this._onStartPlaceMarkerTool} title="Click here and then click the view to place a new marker">Place Marker</Button>
        </div>
      </>
    );
  }

  /** The sample's render method */
  public render() {
    this.props.setupControlPane("Use the options below to control the marker pins.  Click a marker to open a menu of options.", this.getControls());
    return (
      <>
        <ReloadableViewport iModelName={this.props.iModelName} onIModelReady={this.onIModelReady} getCustomViewState={MarkerPinsUI.getTopView} />      </>
    );
  }
}
