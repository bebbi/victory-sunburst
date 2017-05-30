/* eslint-disable no-magic-numbers */
import React from "react";
import PropTypes from "prop-types";
import { partialRight } from "lodash";
import {
  addEvents, Helpers, PropTypes as CustomPropTypes, VictoryContainer, VictoryTheme
} from "victory-core";

import SunburstHelpers from "./helper-methods";
import flare from "../../flare.js";

const fallbackProps = {
  height: 700,
  padding: 30,
  width: 700,
  colorScale: [
    "#ffffff",
    "#f0f0f0",
    "#d9d9d9",
    "#bdbdbd",
    "#969696",
    "#737373",
    "#525252",
    "#252525",
    "#000000"
  ]
};

class VictorySunburst extends React.Component {
  static displayName = "VictorySunburst";

  static role = "sunburst";

  static propTypes = {
    colorScale: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.oneOf([
        "grayscale", "qualitative", "heatmap", "warm", "cool", "red", "green", "blue"
      ])
    ]),
    containerComponent: PropTypes.element,
    data: PropTypes.object,
    displayCore: PropTypes.bool,
    eventKey: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string
    ]),
    events: PropTypes.arrayOf(PropTypes.shape({
      target: PropTypes.oneOf(["data", "parent"]),
      eventKey: PropTypes.oneOfType([
        PropTypes.func,
        CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
        PropTypes.string
      ]),
      eventHandlers: PropTypes.object
    })),
    groupComponent: PropTypes.element,
    height: CustomPropTypes.nonNegative,
    minRadians: CustomPropTypes.nonNegative,
    onArcHover: PropTypes.func,
    padding: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        top: PropTypes.number, bottom: PropTypes.number,
        left: PropTypes.number, right: PropTypes.number
      })
    ]),
    sharedEvents: PropTypes.shape({
      events: PropTypes.array,
      getEventState: PropTypes.func
    }),
    sort: PropTypes.bool,
    standalone: PropTypes.bool,
    style: PropTypes.shape({
      parent: PropTypes.object, data: PropTypes.object, labels: PropTypes.object
    }),
    theme: PropTypes.object,
    width: CustomPropTypes.nonNegative
  };

  static defaultProps = {
    colorScale: "blue",
    containerComponent: <VictoryContainer/>,
    data: flare,
    displayCore: false,
    groupComponent: <g/>,
    minRadians: 0,
    sort: true,
    standalone: true,
    style: { data: { cursor: "pointer" } },
    theme: VictoryTheme.grayscale
  };

  static getBaseProps = partialRight(
    SunburstHelpers.getBaseProps.bind(SunburstHelpers),
    fallbackProps
  );

  static expectedComponents = [
    "containerComponent", "groupComponent"
  ];

  renderSunburstData(props) {
    const { displayCore, onArcHover } = props;
    const { arcs, colors, pathFunction, style } = SunburstHelpers.getCalculatedValues(props);

    const children = arcs.map((arc, i) => (
      <path
        key={`arc-${i}`}
        d={pathFunction(arc)}
        display={arc.depth || displayCore ? null : "none"}
        fill={colors((arc.children ? arc : arc.parent).data.name)}
        onMouseOver={(ev) => onArcHover(arc, ev)}
        onMouseOut={() => onArcHover()}
        style={style.data}
        stroke="white"
      />
    ));

    return this.renderGroup(props, children);
  }

  // Overridden in victory-native
  renderGroup(props, children) {
    const offset = this.getOffset(props);
    const transform = `translate(${offset.x}, ${offset.y})`;
    const groupComponent = React.cloneElement(props.groupComponent, { transform });
    return this.renderContainer(groupComponent, children);
  }

  getOffset(props) {
    const { width, height } = props;
    const calculatedProps = SunburstHelpers.getCalculatedValues(props);
    const { padding, radius } = calculatedProps;
    const offsetWidth = width / 2 + padding.left - padding.right;
    const offsetHeight = height / 2 + padding.top - padding.bottom;
    return {
      x: offsetWidth + radius > width ? radius + padding.left - padding.right : offsetWidth,
      y: offsetHeight + radius > height ? radius + padding.top - padding.bottom : offsetHeight
    };
  }

  render() {
    const { role } = this.constructor;
    const props = Helpers.modifyProps(this.props, fallbackProps, role);

    const children = this.renderSunburstData(props);
    return props.standalone ? this.renderContainer(props.containerComponent, children) : children;
  }
}

export default addEvents(VictorySunburst);
