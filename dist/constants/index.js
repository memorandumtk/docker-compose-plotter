"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = exports.FOUR_SPACES = exports.TWO_SPACES = exports.DescriptionOfColors = exports.ARROWS_TO_RIGHT = void 0;
exports.ARROWS_TO_RIGHT = {
    inheritance: "--|>",
    composition: "--*",
    aggregation: "--o",
    association: "-->",
    solidlink: "--",
    dependency: "..>",
    realization: "..|>",
    linkdashed: ".."
};
exports.DescriptionOfColors = "*red - container, green - network, blue - volume";
exports.TWO_SPACES = "  ";
exports.FOUR_SPACES = `${exports.TWO_SPACES}${exports.TWO_SPACES}`;
exports.COLORS = {
    container: {
        fill: "#f00",
        color: "#fff"
    },
    network: {
        fill: "#0f0",
        color: "#fff"
    },
    volume: {
        fill: "#00f",
        color: "#fff"
    }
};
