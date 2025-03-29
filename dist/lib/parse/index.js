"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseComposeConfigStdOut = exports.parseComposeFile = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const parseComposeFile = (filePath) => {
    try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const data = yaml.load(fileContents);
        if (!data) {
            console.log({ notExpectedDataType: data });
            throw new Error("data's type was not expected.");
        }
        else {
            return data;
        }
    }
    catch (e) {
        throw new Error(`Failed to parse YAML: ${e.message}`);
    }
};
exports.parseComposeFile = parseComposeFile;
const parseComposeConfigStdOut = (stdout) => {
    try {
        const data = yaml.load(stdout);
        if (!data) {
            console.log({ notExpectedDataType: data });
            throw new Error("data's type was not expected.");
        }
        else {
            return data;
        }
    }
    catch (e) {
        throw new Error(`Failed to parse YAML: ${e.message}`);
    }
};
exports.parseComposeConfigStdOut = parseComposeConfigStdOut;
