import React from "react";
import {Composition} from "remotion";
import config from "../short.config.json";
import {BridgeShort, BRIDGE_FRAMES} from "../templates/bridge/Bridge";
import {TidalTurbinePrototype, TIDAL_TURBINE_FRAMES} from "./videos/tidal-turbine/TidalTurbine";
import {
  TidalTurbineExplainer60,
  TIDAL_TURBINE_60_FRAMES,
} from "./videos/tidal-turbine/TidalTurbineExplainer60";

const {composition} = config;

if (composition.durationInFrames !== BRIDGE_FRAMES) {
  throw new Error(
    `short.config.json declares ${composition.durationInFrames} frames, but Bridge.tsx exports ${BRIDGE_FRAMES}`,
  );
}

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id={composition.id}
      component={BridgeShort}
      durationInFrames={composition.durationInFrames}
      fps={composition.fps}
      width={composition.width}
      height={composition.height}
    />
    <Composition
      id="TidalTurbinePrototype"
      component={TidalTurbinePrototype}
      durationInFrames={TIDAL_TURBINE_FRAMES}
      fps={30}
      width={540}
      height={960}
    />
    <Composition
      id="TidalTurbineExplainer60"
      component={TidalTurbineExplainer60}
      durationInFrames={TIDAL_TURBINE_60_FRAMES}
      fps={30}
      width={540}
      height={960}
    />
  </>
);
