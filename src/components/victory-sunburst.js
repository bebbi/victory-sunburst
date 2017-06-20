/* eslint-disable no-magic-numbers */
import React from "react";
import PropTypes from "prop-types";
import { partialRight } from "lodash";
import {
  addEvents, Helpers, PropTypes as CustomPropTypes, Slice,
  VictoryContainer, VictoryTheme, VictoryTooltip
} from "victory-core";

import SunburstHelpers from "./helper-methods";
const size = 400;
const fallbackProps = {
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
  ],
  height: size,
  padding: 30,
  width: size
};
const position = (size + padding * 2) / 2;
const tooltipProps = {
  height: 50,
  flyoutStyle: {
    fill: "white",
    padding: 10,
    stroke: "lightgray",
    strokeWidth: 0.5
  },
  pointerLength: 0,
  width: 100,
  x: position,
  y: position
};

const animationWhitelist = [
  "data", "height", "padding", "colorScale", "style", "width"
];

class VictorySunburst extends React.Component {
  static displayName = "VictorySunburst";

  static role = "sunburst";

  static defaultTransitions = {
    onExit: {
      duration: 500,
      before: () => {}
    },
    onEnter: {
      duration: 500,
      before: () => {},
      after: () => {}
    }
  };

  static propTypes = {
    activeNodeIndex: CustomPropTypes.nonNegative,
    animate: PropTypes.object,
    colorScale: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.oneOf([
        "grayscale", "qualitative", "heatmap", "warm", "cool", "red", "green", "blue"
      ])
    ]),
    containerComponent: PropTypes.element,
    data: PropTypes.object,
    dataComponent: PropTypes.element,
    displayRoot: PropTypes.bool,
    eventKey: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string
    ]),
    events: PropTypes.arrayOf(PropTypes.shape({
      target: PropTypes.oneOf(["data", "parent", "labels"]),
      eventKey: PropTypes.oneOfType([
        PropTypes.func,
        CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
        PropTypes.string
      ]),
      eventHandlers: PropTypes.object
    })),
    groupComponent: PropTypes.element,
    height: CustomPropTypes.nonNegative,
    labelComponent: PropTypes.element,
    minRadians: CustomPropTypes.nonNegative,
    name: PropTypes.string,
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
    sortData: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    standalone: PropTypes.bool,
    style: PropTypes.shape({
      parent: PropTypes.object, data: PropTypes.object, labels: PropTypes.object
    }),
    sumBy: PropTypes.oneOf(["count", "size"]),
    theme: PropTypes.object,
    width: CustomPropTypes.nonNegative,
    x: PropTypes.number,
    y: PropTypes.number
  };

  static defaultProps = {
    colorScale: "blue",
    containerComponent: <VictoryContainer/>,
    data: {
      name: "A",
      children: [
        { name: "B1", size: 5 },
        {
          name: "B2",
          children: [
            { name: "B2A", size: 4 },
            {
              name: "B2B",
              children: [
                { name: "B2B1", size: 4 },
                { name: "B2B2", size: 4 }
              ]
            }
          ]
        },
        {
          name: "B3",
          children: [
            { name: "B3A", size: 3 },
            { name: "B3B", size: 5 }
          ]
        }
      ]
    },
    dataComponent: <Slice/>,
    displayRoot: false,
    groupComponent: <g/>,
    labelComponent: <VictoryTooltip {...tooltipProps}/>,
    minRadians: 0.001,
    sortData: false,
    standalone: true,
    style: {
      data: {
        cursor: "pointer",
        stroke: "white"
      }
    },
    sumBy: "size",
    theme: VictoryTheme.grayscale,
    x: 0,
    y: 0
  };

  static getBaseProps = partialRight(
    SunburstHelpers.getBaseProps.bind(SunburstHelpers),
    fallbackProps
  );
  static expectedComponents = [
    "containerComponent", "dataComponent", "groupComponent"
  ];

  renderSunburstData(props) {
    const { activeNodeIndex, dataComponent, labelComponent } = props;
    let labelProps = { key: "tooltip" };
    const dataComponents = [];

    for (let index = 0, len = this.dataKeys.length; index < len; index++) {
      const dataProps = this.getComponentProps(dataComponent, "data", index);
      dataComponents[index] = React.cloneElement(dataComponent, dataProps);
    }

    if (activeNodeIndex) {
      const { data } = dataComponents[activeNodeIndex || 0].props.datum;
      labelProps = { ...labelProps, active: true, text: `${data.name}: ${data.size}` };
    }

    const tooltipComponent = React.cloneElement(labelComponent, labelProps);
    const children = [...dataComponents, tooltipComponent];

    return this.renderGroup(props, children);
  }

  renderGroup(props, children) {
    const offset = this.getOffset(props);
    const transform = `translate(${offset.x}, ${offset.y})`;
    const groupComponent = React.cloneElement(props.groupComponent, { transform });
    return this.renderContainer(groupComponent, children);
  }

  getOffset(props) {
    const { height, width } = props;
    const { padding, radius } = this.baseProps.parent;
    const offsetWidth = width / 2 + padding.left - padding.right;
    const offsetHeight = height / 2 + padding.top - padding.bottom;
    return {
      x: offsetWidth + radius > width ? radius + padding.left - padding.right : offsetWidth,
      y: offsetHeight + radius > height ? radius + padding.top - padding.bottom : offsetHeight
    };
  }

  shouldAnimate() {
    return Boolean(this.props.animate);
  }

  render() {
    const { role } = this.constructor;
    const props = Helpers.modifyProps(this.props, fallbackProps, role);

    if (this.shouldAnimate()) {
      return this.animateComponent(props, animationWhitelist);
    }

    const children = this.renderSunburstData(props);
    return props.standalone ? this.renderContainer(props.containerComponent, children) : children;
  }
}

export default addEvents(VictorySunburst);
