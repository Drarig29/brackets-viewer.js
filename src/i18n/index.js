"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locales = void 0;
const translation_json_1 = __importDefault(require("./en/translation.json"));
const translation_json_2 = __importDefault(require("./fr/translation.json"));
exports.locales = {
    en: translation_json_1.default,
    fr: translation_json_2.default,
};
