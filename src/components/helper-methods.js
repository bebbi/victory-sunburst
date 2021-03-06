/* eslint-disable no-magic-numbers */
import { defaultsDeep, isFunction, omit } from "lodash";
import * as d3Hierarchy from "d3-hierarchy";
import * as d3Shape from "d3-shape";
import * as d3Scale from "d3-scale";
import { Helpers, Style } from "victory-core";

export default {
  checkForValidText(text) {
    if (text === undefined || text === null) {
      return text;
    } else {
      return `${text}`;
    }
  },

  getSliceStyle(datum, calculatedValues) {
    const { colors, style } = calculatedValues;
    const fill = this.getSliceColor(datum, colors, style);
    return defaultsDeep({}, datum.style, { fill }, style.data);
  },

  getBaseProps(props, fallbackProps) {
    props = this.modifyProps(props, fallbackProps, "sunburst");
    const calculatedValues = this.getCalculatedValues(props);
    const { height, standalone, width } = props;
    const { data, padding, pathFunction, radius, slices, style } = calculatedValues;
    const childProps = {
      parent: {
        data, height, padding, pathFunction, radius, slices, standalone, style: style.parent, width
      }
    };

    for (let index = 0, len = slices.length; index < len; index++) {
      const datum = slices[index];
      const eventKey = datum.eventKey || index;
      const dataProps = {
        index, pathFunction, datum, slice: datum,
        style: this.getSliceStyle(datum, calculatedValues)
      };

      childProps[eventKey] = {
        data: dataProps,
        labels: this.getLabelProps(props, dataProps, calculatedValues)
      };
    }

    return childProps;
  },

  getCalculatedValues(props) {
    const { colorScale, data, theme } = props;
    const themeStyles = theme && theme.sunburst && theme.sunburst.style ? theme.sunburst.style : {};
    const style = defaultsDeep({}, props.style, themeStyles);
    const padding = Helpers.getPadding(props);
    const radius = this.getRadius(props, padding);
    const slices = this.getSlices(props, radius);
    const colors = d3Scale.scaleOrdinal(
      Array.isArray(colorScale) ? colorScale : Style.getColorScale(colorScale)
    );

    this.sumNodes(data);

    const pathFunction = d3Shape.arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1);

    return { colors, data, padding, pathFunction, radius, slices, style, totalSize: data.size };
  },

  getSliceColor(datum, colors, style) {
    if (style && style.data && style.data.fill) {
      return style.data.fill;
    }
    return colors && colors((datum.children ? datum.data : datum.parent.data).name);
  },

  getLabelOrientation(slice) {
    const start = this.radiansToDegrees(slice.x0);
    const end = this.radiansToDegrees(slice.x1);
    const degree = start + (end - start) / 2;
    if (degree < 45 || degree > 315) {
      return "top";
    } else if (degree >= 45 && degree < 135) {
      return "right";
    } else if (degree >= 135 && degree < 225) {
      return "bottom";
    } else {
      return "left";
    }
  },

  getLabelProps(props, dataProps, calculatedValues) {
    const { index, datum, data, pathFunction, slice } = dataProps;
    const { style, totalSize } = calculatedValues;
    const labelStyle = { padding: 0, ...style.labels };
    const position = index === 0 ? [0, 0] : pathFunction.centroid(slice);
    const orientation = this.getLabelOrientation(slice);

    return {
      index, datum, data, slice, orientation,
      style: labelStyle,
      x: Math.round(position[0]),
      y: Math.round(position[1]),
      text: this.getLabelText(props, datum, totalSize, index),
      textAnchor: labelStyle.textAnchor || this.getTextAnchor(orientation),
      verticalAnchor: labelStyle.verticalAnchor || this.getVerticalAnchor(orientation),
      angle: labelStyle.angle
    };
  },

  getRadius({ width, height }, padding) {
    return Math.min(
      width - padding.left - padding.right,
      height - padding.top - padding.bottom
    ) / 2;
  },

  getTextAnchor(orientation) {
    if (orientation === "top" || orientation === "bottom") {
      return "middle";
    }
    return orientation === "right" ? "start" : "end";
  },

  getVerticalAnchor(orientation) {
    if (orientation === "left" || orientation === "right") {
      return "middle";
    }
    return orientation === "bottom" ? "start" : "end";
  },

  getLabelText(props, datum, totalSize, index) { // eslint-disable-line max-params
    let text;
    if (datum.label) {
      text = datum.label;
    } else if (Array.isArray(props.labels)) {
      text = props.labels[index];
    } else {
      text = isFunction(props.labels) ? props.labels(datum, totalSize) : datum.data.name;
    }
    return this.checkForValidText(text);
  },

  getSlices(props, radius) {
    const { data, minRadians, sortData, sumBy } = props;
    const compareFunction = this.getSort(sortData);
    const root = d3Hierarchy.hierarchy(data, (d) => d.children)
      .sum((d) => {
        if (d.children) { return 0; }
        return sumBy === "size" ? d.size : 1;
      })
      .sort(compareFunction);

    const partition = d3Hierarchy.partition()
      .size([2 * Math.PI, radius]);

    const nodes = partition(root).descendants()
      .filter((d) => {
        return (d.x1 - d.x0) > minRadians;
      });

    return nodes;
  },

  getSort(sortData) {
    let compareFunction = null;
    if (sortData) {
      compareFunction = sortData === true
        ? (a, b) => { return b.value - a.value; }
        : sortData;
    }
    return compareFunction;
  },

  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  },

  modifyProps(props, fallbackProps, role) {
    const theme = props.theme && props.theme[role] ? props.theme[role] : {};
    const themeProps = omit(theme, ["style"]);
    return defaultsDeep({}, props, themeProps, fallbackProps);
  },

  sumNodes(node) {
    if (node.children && node.children.length > 0) {
      node.size = 0;
      for (let i = 0; i < node.children.length; i++) {
        node.size += this.sumNodes(node.children[i]);
      }
    }
    return node.size;
  }
};
